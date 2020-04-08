const worldPop = 7794798739;
let worldwideData;

const updateWorld = (res) => Object.keys(res)
    .filter(k => k != 'source')
    .forEach(id => {
        const value = popButton.classList.contains('clicked')
            ? 100 * Math.round(1000000 * res[id] / worldPop) / 1000000
            : formatInt(res[id]);
        document.getElementById(id).textContent = ` ${value}${popButton.classList.contains('clicked') ? '%' : ''}`;
    });

const displayError = (err) => {
    console.log(err);
    const userMessage = document.getElementById('userMessage');

    userMessage.innerHTML = '';

    userMessage.appendChild(document.createElement('hr'));
    const mess = document.createElement('p');
    const messText = {
        en: "The data source is not reachable 😕, please try again later.",
        fr: "La source des données n'est pas disponible 😕, veuillez réessayer plus tard, merci.",
        es: "No se puede acceder a la fuente de datos 😕, intente nuevamente más tarde."
    }
    mess.innerHTML = messText[lang];
    mess.classList.add('error');
    userMessage.appendChild(mess);

    const centerContainer = document.createElement('div');
    centerContainer.className = "centerContainer";

    const home = document.createElement('button');
    home.id = 'home';
    home.addEventListener('click', () => {
        window.location.href = window.origin;
    });

    const homeText = {
        en: 'Checkout my other projects',
        fr: 'Voir mes autres projets',
        es: 'Inicio'
    };
    home.className = 'button_corona clickable';
    home.innerHTML = homeText[lang];
    centerContainer.appendChild(home);
    userMessage.appendChild(centerContainer);
    userMessage.appendChild(document.createElement('br'));
    userMessage.appendChild(document.createElement('hr'));
    userMessage.appendChild(document.createElement('br'));
}

let urlWorldwide = () => `${API()}${SOURCEDOWN ? 'worldwide.json' : 'global=stats'}`;

const initWorld = () => fetch(urlWorldwide())
    .then(res => res.json())
    .then(data => {
        worldwideData = data.results[0];
        updateWorld(worldwideData);
    })
    .catch(err => {
        SOURCEDOWN = true;
        initWorld();
        console.log('Failed to retrieve data for the world section', err);
        console.log('Retrieving from github');
        updateDate();
    });
initWorld();