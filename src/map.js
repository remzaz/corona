const m_width = document.getElementById("container").offsetWidth;
const m_height = m_width * 0.6;

const map = d3.select('#map').append("svg")
    .attr("id", "svg")
    .attr("class", "svg")
    .attr("width", m_width)
    .attr("height", m_height);

const projection = d3.geoNaturalEarth1()
    .scale(1)
    .translate([0, 0]);

const path = d3.geoPath()
    .pointRadius(2)
    .projection(projection);

const cGroup = map.append("g");
const focusCountry = getParams().main || 'FR';
const countryPopulation = document.getElementById('countryPopulation');
const countryTitle = document.getElementById("country");
const popText = {
    en: 'inhabitants',
    fr: 'habitants'
}

const create_map = (countries) => {
    d3.json(`${(lang === 'en' ? '' : '../')}data/static/worldGeojson.json`)
        .then((geojson) => {
            const b = path.bounds(geojson),
                s = 1 / Math.max((b[1][0] - b[0][0]) / m_width, (b[1][1] - b[0][1]) / m_height),
                t = [(m_width - s * (b[1][0] + b[0][0])) / 2, (m_height - s * (b[1][1] + b[0][1])) / 2];

            projection
                .scale(s)
                .translate(t);

            cGroup.selectAll("path")
                .data(geojson.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("id", (d) => d.id)
                .attr("class", "country clickable")
                .on("click", function (d) {
                    d3.selectAll('.country').classed("selected", false)
                    d3.select(this).classed("selected", true);
                    countryPopulation.innerHTML = `${formatInt(getPop(d.id))} ${popText[lang]}`;
                    countryTitle.innerHTML = `${getFlag(d.id)} ${getName(d.id)}`;
                    updateCountryData(d.id);
                    setParams({ main: d.id });
                });

            // init
            updateCountryData(focusCountry);

            countryPopulation.innerHTML = `${formatInt(getPop(focusCountry))} ${popText[lang]}`;
            countryTitle.innerHTML = `${getFlag(focusCountry)} ${getName(focusCountry)}`;
            map.select(`path#${focusCountry}`).classed("selected", true);
        });
}

const countryStats = ['c_total_cases', 'c_total_recovered', 'c_total_unresolved',
    'c_total_deaths', 'c_total_new_cases_today', 'c_total_new_deaths_today',
    'c_total_active_cases', 'c_total_serious_cases'];

let countryData;
const updateCountryHtml = () => countryStats.forEach(k => {
    const span = document.getElementById(k);
    const value = popButton.classList.contains('clicked')
        ? 100 * Math.round(1000000 * countryData[k.slice(2)] / getPop(focusCountry)) / 1000000
        : formatInt(countryData[k.slice(2)]);
    span.innerHTML = `${value}${popButton.classList.contains('clicked') ? '%' : ''}`;
});

const urlCountry = (iso) => `${API()}${SOURCEDOWN ? `${iso}_total.json` : `countryTotal=${iso}`}`;
const updateCountryData = (iso) => fetch(urlCountry(iso))
    .then(res => res.json())
    .then(data => {
        countryData = data.countrydata[0];
        updateCountryHtml();
    })
    .catch(err => {
        SOURCEDOWN = true;
        console.log('Failed to retrieve data for the map section', err);
        console.log('Retrieving from github');
        updateDate();
        updateCountryData(iso);
    })

