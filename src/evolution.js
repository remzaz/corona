const available = ["AF", "AL", "DZ", "AO", "AR", "AM", "AU", "AT", "AZ", "BS",
    "BD", "BY", "BE", "BZ", "BJ", "BT", "BO", "BA", "BW", "BR",
    "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CI", "CF", "TD",
    "CL", "CN", "CO", "CG", "CD", "CR", "HR", "CU", "CY", "CZ",
    "DK", "DP", "DJ", "DO", "EC", "EG", "SV", "GQ", "ER",
    "EE", "ET", "FK", "FJ", "FI", "FR", "GF", "TF", "GA", "GM",
    "GE", "DE", "GH", "GR", "GL", "GT", "GN", "GW", "GY", "HT",
    "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IL",
    "IT", "JM", "JP", "JO", "KZ", "KE", "KP", "XK", "KW", "KG",
    "LA", "LV", "LB", "LS", "LR", "LY", "LT", "LU", "MK", "MG",
    "MW", "MY", "ML", "MR", "MX", "MD", "MN", "ME", "MA", "MZ",
    "MM", "NA", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "KP",
    "NO", "OM", "PK", "PS", "PA", "PG", "PY", "PE", "PH", "PL",
    "PT", "PR", "QA", "XK", "RO", "RU", "RW", "SA", "SN", "RS",
    "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "KR", "SS", "ES",
    "LK", "SD", "SR", "SJ", "SZ", "SE", "CH", "SY", "TW", "TJ",
    "TZ", "TH", "TL", "TG", "TT", "TN", "TR", "TM", "AE", "UG",
    "GB", "UA", "US", "UY", "UZ", "VU", "VE", "VN", "EH", "YE",
    "ZM", "ZW"];

const helpDel = document.getElementById('helpDel');
let countriesSelected = (getParams().comp || 'FRIT').match(/.{1,2}/g);
let countrySelector = document.getElementById('countrySelector');
let countrySelected = document.getElementById('countrySelected');

const colors = ['#FF8D54', '#7F2B00', '#3F72A6', '#042A52', '#38AA85', '#005439']
const logButton = document.getElementById('logButton');
getParams().log ? logButton.classList.add('clicked') : null;

const metricSelector = document.getElementById('metricSelector');
let selected = getParams().metric || 'total_cases';
metricSelector.value = selected;

// set the dimensions and margins of the graph
let margin = { top: 10, right: 30, bottom: 45, left: 60 },
    width = document.getElementById("containerPlot").offsetWidth - margin.left - margin.right,
    height = document.getElementById("containerPlot").offsetWidth - margin.top - margin.bottom;
// append the svg object to the body of the page
let svg = d3.select("#plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

let urlTimeline = (iso) => `${API()}${SOURCEDOWN ? `${iso}_timeline.json` : `countryTimeline=${iso}`}`;

const getData = async (iso) => fetch(urlTimeline(iso))
    .then(res => res.json())
    .then(raw => Object.entries(raw.timelineitems[0])
        .filter(entry => entry[0] != 'stat')
        .map(([date, rest]) => ({ date: d3.timeParse("%m/%d/%Y")(date), ...rest }))
        .sort((a, b) => (a.date > b.date) ? 1 : -1)
    )
    .catch(err => {
        console.log('Failed to retrieve data for the plot section', err);
        console.log('Retrieving from github');
        SOURCEDOWN = true;
        updateDate();
        return getData(iso);
    });
let full;

const buildChart = (full) => {
    svg.selectAll("*").remove();

    const updateMetric = (isCreated) => {
        isCreated && svg.selectAll('*').remove();

        let x = d3.scaleTime()
            .domain(d3.extent(full.flat(), (d) => d.date))
            .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("class", "axis x")
            .call(d3.axisBottom(x).ticks(10))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", "-.5em")
            .attr("transform", "rotate(-65)");

        selected = metricSelector.value;
        const max_y = d3.max(full.map(series => d3.max(series.map(d => d[selected]))));
        let y = (logButton.classList.contains('clicked') ? d3.scaleLog() : d3.scaleLinear())
            .domain([1, max_y])
            .range([height, 0]);

        let yAxis = d3.axisLeft()
            .scale(y)
            .tickFormat(d3.format(","))
            .ticks(4);

        svg.append("g")
            .attr("class", "axis y")
            .call(yAxis);

        full.map((data, i) => svg.append("path")
            .attr("class", "line")
            .datum(data.filter(d => d[selected] > 0))
            .attr("fill", "none")
            .attr("stroke", colors[i])
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x((d) => x(d.date))
                .y((d) => {
                    return y(d[selected]);
                })
            ));

        logButton.addEventListener("click", function () {
            logButton.classList.contains('clicked')
                ? logButton.classList.remove('clicked')
                : logButton.classList.add('clicked');
            setParams('log');
            if (getParams().log) {
                y = d3.scaleLog()
                    .domain([1, max_y])
                    .range([height, 0]);
            } else {
                y = d3.scaleLinear()
                    .domain([1, max_y])
                    .range([height, 0]);
            }
            yAxis.scale(y);
            d3.select("g.axis.y")
                .transition()
                .ease(d3.easeCubicOut)
                .duration(500)
                .call(yAxis);

            d3.selectAll(".line")
                .transition()
                .ease(d3.easeCubicOut)
                .duration(500)
                .attr("d", d3.line()
                    .x((d) => x(d.date))
                    .y((d) => y(d[selected]))
                )
        })
    }
    updateMetric(false);
    metricSelector.onchange = () => {
        setParams({ metric: metricSelector.value });
        updateMetric(true)
    };
}

const updateLinechart = () => {
    Promise.all(countriesSelected.map(getData))
        .then(full_ => {
            full = full_.map((data, i) => {
                const population = getPop(countriesSelected[i]);
                return data.map(record => ({ population, ...record }))
            });
            buildChart(full);
        })
        .catch(err => console.log("Error", err));
}

const createLinechart = (countries) => {
    countries_ = countries.filter(({ iso }) => available.includes(iso))
        .sort((a, b) => a.name[lang].localeCompare(b.name[lang]));
    const update_countrySelector = () => {
        updateLinechart();

        const init = document.createElement('option');
        init.value = '';
        init.disabled = true;
        init.selected = true;
        init.innerHTML = lang === 'en' ? 'Add a country' : 'Ajoutez un pays';

        countrySelector.innerHTML = '';
        countrySelector.appendChild(init);
        helpDel.innerHTML = countriesSelected.length ? lang === 'en' ? '👇 Click a country to hide it 🗑️' : '👇 Touchez un pays pour l\'effacer 🗑️' : '';
        countrySelected.innerHTML = '';
        countries_.filter(({ iso }) => !countriesSelected.includes(iso))
            .forEach(c => {
                let opt = document.createElement('option');
                opt.value = c.iso;
                opt.innerHTML = `${c.flag} ${c.name[lang]}`;
                countrySelector.appendChild(opt);
            });
        countrySelector.onchange = () => {
            countriesSelected.length >= colors.length ? countriesSelected.pop() : false;
            countriesSelected.unshift(Array.from(countrySelector.selectedOptions)[0].value);
            setParams({ comp: countriesSelected.join('') });
            update_countrySelector();
        };
        countriesSelected
            .forEach((ciso, i) => {
                const c = getCountry(ciso);
                let span = document.createElement('span');
                span.className = "clickable";
                span.id = `_${ciso}`;
                span.style.color = colors[i];
                span.innerHTML = `${c.flag} ${c.name[lang]}`;
                countrySelected.appendChild(span);
                span.style.padding = "0 .8rem 0 0";
                span.style.wordWrap = 'none';
                span.addEventListener('click', () => {
                    countriesSelected = countriesSelected.filter(iso => iso != ciso);
                    setParams({ comp: countriesSelected.join('') });
                    update_countrySelector();
                });
            });
    }
    update_countrySelector();
};