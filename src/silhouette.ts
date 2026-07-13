const ALPHA_THRESHOLD = 8

/**
 * 将 Logo 与文字的 Alpha 蒙版合并成连续底色：
 * 1. 二值化；2. 圆形膨胀；3. 从边界泛洪；4. 填充未被边界触达的孔洞。
 */
export function createFilledSilhouette(
  alpha: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
) {
  const size = width * height
  if (alpha.length !== size) {
    throw new Error(`Alpha mask length ${alpha.length} does not match ${width} × ${height}`)
  }

  const source = new Uint8Array(size)
  for (let index = 0; index < size; index += 1) {
    source[index] = alpha[index] > ALPHA_THRESHOLD ? 1 : 0
  }

  // 3/4 权重的双向 Chamfer 距离场，复杂度为 O(width × height)。
  // 相比逐像素圆形盖章，适合高分辨率抗锯齿蒙版。
  const maximumDistance = 0xffff
  const distance = new Uint16Array(size)
  for (let index = 0; index < size; index += 1) {
    distance[index] = source[index] === 1 ? 0 : maximumDistance
  }

  const relax = (index: number, candidate: number) => {
    if (candidate < distance[index]) distance[index] = candidate
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      if (x > 0) relax(index, distance[index - 1] + 3)
      if (y > 0) {
        relax(index, distance[index - width] + 3)
        if (x > 0) relax(index, distance[index - width - 1] + 4)
        if (x < width - 1) relax(index, distance[index - width + 1] + 4)
      }
    }
  }
  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      const index = y * width + x
      if (x < width - 1) relax(index, distance[index + 1] + 3)
      if (y < height - 1) {
        relax(index, distance[index + width] + 3)
        if (x > 0) relax(index, distance[index + width - 1] + 4)
        if (x < width - 1) relax(index, distance[index + width + 1] + 4)
      }
    }
  }

  const dilated = new Uint8Array(size)
  const radiusDistance = Math.max(0, Math.round(radius * 3))
  for (let index = 0; index < size; index += 1) {
    dilated[index] = distance[index] <= radiusDistance ? 1 : 0
  }

  // 只有能从画布边缘抵达的透明像素才属于真正的外部区域。
  const outside = new Uint8Array(size)
  const queue = new Int32Array(size)
  let queueStart = 0
  let queueEnd = 0

  const enqueue = (index: number) => {
    if (dilated[index] === 0 && outside[index] === 0) {
      outside[index] = 1
      queue[queueEnd] = index
      queueEnd += 1
    }
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width)
    enqueue(y * width + width - 1)
  }

  while (queueStart < queueEnd) {
    const index = queue[queueStart]
    queueStart += 1
    const x = index % width
    const y = Math.floor(index / width)
    if (x > 0) enqueue(index - 1)
    if (x < width - 1) enqueue(index + 1)
    if (y > 0) enqueue(index - width)
    if (y < height - 1) enqueue(index + width)
  }

  const result = new Uint8ClampedArray(size)
  for (let index = 0; index < size; index += 1) {
    // 膨胀后的实体，以及被实体完整包围的孔洞，均属于最终底色。
    result[index] = dilated[index] === 1 || outside[index] === 0 ? 255 : 0
  }
  return result
}

export function extractAlpha(imageData: ImageData) {
  const alpha = new Uint8ClampedArray(imageData.width * imageData.height)
  for (let source = 3, target = 0; source < imageData.data.length; source += 4, target += 1) {
    alpha[target] = imageData.data[source]
  }
  return alpha
}

export function alphaToImageData(alpha: Uint8ClampedArray, width: number, height: number) {
  const imageData = new ImageData(width, height)
  for (let source = 0, target = 0; source < alpha.length; source += 1, target += 4) {
    imageData.data[target] = 255
    imageData.data[target + 1] = 255
    imageData.data[target + 2] = 255
    imageData.data[target + 3] = alpha[source]
  }
  return imageData
}

/**
 * 对二值轮廓做可调羽化，并通过 smoothstep 保住主体形状。
 * 结果包含多级 Alpha，供最终缩放时生成更细腻的过渡边缘。
 */
export function smoothAlpha(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.max(0, Math.round(radius))
  if (safeRadius === 0) return alpha.slice()
  const divisor = safeRadius * 2 + 1
  const horizontal = new Float32Array(alpha.length)
  const vertical = new Float32Array(alpha.length)

  for (let y = 0; y < height; y += 1) {
    const row = y * width
    let sum = 0
    for (let x = -safeRadius; x <= safeRadius; x += 1) {
      if (x >= 0 && x < width) sum += alpha[row + x]
    }
    for (let x = 0; x < width; x += 1) {
      horizontal[row + x] = sum / divisor
      const removeX = x - safeRadius
      const addX = x + safeRadius + 1
      if (removeX >= 0) sum -= alpha[row + removeX]
      if (addX < width) sum += alpha[row + addX]
    }
  }

  for (let x = 0; x < width; x += 1) {
    let sum = 0
    for (let y = -safeRadius; y <= safeRadius; y += 1) {
      if (y >= 0 && y < height) sum += horizontal[y * width + x]
    }
    for (let y = 0; y < height; y += 1) {
      vertical[y * width + x] = sum / divisor
      const removeY = y - safeRadius
      const addY = y + safeRadius + 1
      if (removeY >= 0) sum -= horizontal[removeY * width + x]
      if (addY < height) sum += horizontal[addY * width + x]
    }
  }

  const result = new Uint8ClampedArray(alpha.length)
  for (let index = 0; index < vertical.length; index += 1) {
    const normalized = Math.max(0, Math.min(1, (vertical[index] / 255 - 0.16) / 0.68))
    const eased = normalized * normalized * (3 - 2 * normalized)
    result[index] = Math.round(eased * 255)
  }
  return result
}
