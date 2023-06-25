echo "Create data directory"
mkdir -p data
echo "Retrieve datasets"
wget -N -P data/ http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2023/geojson/departements-5m.geojson
wget -N -P data/ http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2023/geojson/communes-5m.geojson
wget -N -P data/ http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2023/geojson/mairies.geojson
