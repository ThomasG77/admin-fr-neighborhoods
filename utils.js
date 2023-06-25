import {bfsFromNode} from 'graphology-traversal'

const mergeBoundingBoxes = boundingBoxes => {
  let minLeft = 180
  let minBottom = 90
  let maxRight = -180
  let maxTop = -90

  for (const [left, bottom, right, top] of boundingBoxes) {
    if (left < minLeft) minLeft = left
    if (bottom < minBottom) minBottom = bottom
    if (right > maxRight) maxRight = right
    if (top > maxTop) maxTop = top
  }

  return [minLeft, minBottom, maxRight, maxTop]
}

const neighborsByNodeAndDepth = (graph, insee, bfsDepth) => {
  const results = []
  bfsFromNode(graph, insee, (node, attr, depth) => {
    results.push([node, attr, depth])
    return depth >= bfsDepth
  })
  return results
}

export {mergeBoundingBoxes, neighborsByNodeAndDepth}
