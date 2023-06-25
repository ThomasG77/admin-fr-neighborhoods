import process from 'node:process'
import {readFile} from 'node:fs/promises'
import Graph from 'graphology'
import parseArgs from 'minimist'
import {mergeBoundingBoxes, neighborsByNodeAndDepth} from './utils.js'

async function main(inputfile, insee, bfsDepth) {
  const data = await readFile(inputfile)
  const graph = Graph.from(JSON.parse(data))

  // Displaying useful information about your graph
  console.log('Number of nodes', graph.order)
  console.log('Number of edges', graph.size)
  if (insee && graph.hasNode(insee)) {
    console.time('Execution Time')
    const results = neighborsByNodeAndDepth(graph, insee, bfsDepth)
    console.timeEnd('Execution Time')
    console.log(results)
    console.log(mergeBoundingBoxes(results.map(result => result[1].bbox)))
  }
}

const args = parseArgs(process.argv.slice(2), {
  string: ['insee'], // --lang xml
  integer: ['depth'],
  boolean: ['version'], // --version
  alias: {v: 'version'},
})

if (args._ && args.length !== 1) {
  const inputfile = args._[0]
  let insee = null
  let depth = 1
  if ('insee' in args) {
    insee = args.insee
  }

  if ('depth' in args) {
    depth = args.depth
  }

  try {
    console.log(inputfile, insee, depth)
    await main(inputfile, insee, depth)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}
