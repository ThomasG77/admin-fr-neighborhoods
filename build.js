import process from 'node:process'
import {readFile, writeFile} from 'node:fs/promises'
import {existsSync, mkdirSync} from 'node:fs'
import {topology} from 'topojson-server'
import {neighbors} from 'topojson-client'
import distance from '@turf/distance'
import bbox from '@turf/bbox'
import Graph from 'graphology'

async function main() {
  const graphDept = new Graph({type: 'undirected', multi: false})
  const graphCom = new Graph({type: 'undirected', multi: false})

  const geojsonDeptsText = await readFile('./data/departements-5m.geojson')
  const geojsonDepts = JSON.parse(geojsonDeptsText)

  const geojsonComsText = await readFile('./data/communes-5m.geojson')
  const geojsonComs = JSON.parse(geojsonComsText)
  const arrondissements = geojsonComs.features.filter(element => 'commune' in element.properties)
  const arrondissementsCodes = new Set(arrondissements.map(array => array.code))
  geojsonComs.features = geojsonComs.features.filter(element => !('commune' in element.properties))
  const geojsonComByKey = geojsonComs.features.reduce((acc, curr) => {
    acc[curr.properties.code] = curr
    return acc
  }, {})

  const geojsonMairiesText = await readFile('./data/mairies.geojson')
  const geojsonMairies = JSON.parse(geojsonMairiesText)
  const geojsonMairiesByKey = geojsonMairies.features.filter(feature => !(arrondissementsCodes.has(feature.properties.commune))).reduce((acc, curr) => {
    acc[curr.properties.commune] = curr
    return acc
  }, {})

  const topologyDepartementsCommunes = topology({departements: geojsonDepts, communes: geojsonComs})

  const neighborsDept = neighbors(topologyDepartementsCommunes.objects.departements.geometries)
  /*
  const depts = topojson.feature(
    topologyDepartementsCommunes,
    topologyDepartementsCommunes.objects.departements
  ).features;
  */
  const codesDept = topologyDepartementsCommunes.objects.departements.geometries.map(element => element.properties.code)

  const neighborsCom = neighbors(topologyDepartementsCommunes.objects.communes.geometries)
  /*
  const coms = topojson.feature(
    topologyDepartementsCommunes,
    topologyDepartementsCommunes.objects.communes
  ).features;
  */
  const codesCom = topologyDepartementsCommunes.objects.communes.geometries.map(element => element.properties.code)

  /*
  const associationsDept = neighborsDept.reduce((acc, element, i) => {
    acc[codesDept[i]] = element.map(neighbor => codesDept[neighbor]).filter(element => element.length > 0 && element !== codesDept[i])
    return acc
  }, {})
  */
  const graphDeptOriginsDestinations = neighborsDept.reduce((acc, element, i) => {
    acc = [...acc, ...element.map(neighbor => codesDept[neighbor]).filter(element => element.length > 0 && element !== codesDept[i]).map(element1 => [element1, codesDept[i]])]
    return acc
  }, [])
  for (const [keyOrigine, keyDestination] of graphDeptOriginsDestinations) {
    if (!(graphDept.hasNode(keyOrigine))) {
      graphDept.addNode(keyOrigine)
    }

    if (!(graphDept.hasNode(keyDestination))) {
      graphDept.addNode(keyDestination)
    }

    if (!graphDept.hasEdge(keyOrigine, keyDestination)) {
      graphDept.addEdge(keyOrigine, keyDestination)
    }
  }

  /*
  const associationsCom = neighborsCom.reduce((acc, element, i) => {
    acc[codesCom[i]] = element.map(neighbor => codesCom[neighbor]).filter(element => element.length > 0 && element !== codesCom[i])
    return acc
  }, {})
  */
  const graphComOriginsDestinations = neighborsCom.reduce((acc, element, i) => {
    acc = [...acc, ...element.map(neighbor => codesCom[neighbor]).filter(element => element.length > 0 && element !== codesCom[i]).map(element1 => [element1, codesCom[i]])]
    return acc
  }, [])
  for (const [keyOrigine, keyDestination] of graphComOriginsDestinations) {
    if (!(graphCom.hasNode(keyOrigine))) {
      graphCom.addNode(keyOrigine, {
        nom: geojsonMairiesByKey[keyOrigine].properties.nom,
        bbox: bbox(geojsonComByKey[keyOrigine]),
      })
    }

    if (!(graphCom.hasNode(keyDestination))) {
      graphCom.addNode(keyDestination, {
        nom: geojsonMairiesByKey[keyDestination].properties.nom,
        bbox: bbox(geojsonComByKey[keyOrigine]),
      })
    }

    if (!graphCom.hasEdge(keyOrigine, keyDestination)) {
      graphCom.addEdge(keyOrigine, keyDestination, {
        // eslint-disable-next-line camelcase
        distance_mairies: distance(geojsonMairiesByKey[keyOrigine], geojsonMairiesByKey[keyDestination], {units: 'kilometers'}),
      })
    }
  }

  const dirToCreate = './dist/'
  if (!existsSync(dirToCreate)) {
    mkdirSync(dirToCreate)
  }

  await writeFile('./graph_departements.json', JSON.stringify(graphDept.export(), null, '  '))
  await writeFile('./graph_communes.json', JSON.stringify(graphCom.export(), null, '  '))
}

try {
  await main()
} catch (error) {
  console.error(error)
  process.exit(1)
}
