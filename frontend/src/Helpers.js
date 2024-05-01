import { URL } from './Settings';

export function makeRequestOptions(body, method = 'POST') {
    if (method === 'GET') {
        return {
            method,
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
        };
    }
    return {
        method,
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    };
}


export function fetchWrapper(url, body, method = 'POST') {
    let fullUrl = `${process.env.REACT_APP_URL || URL}${url}`

    if (method === 'GET') {
        if (body) {
            const queryParams = new URLSearchParams(body).toString();
            fullUrl = `${fullUrl}?${queryParams}`;
        }
    }
    return fetch(fullUrl, makeRequestOptions(body, method))
        .then(response => {
            if (!response.ok) {
                // Always print this
                console.log(response.json());
                return {
                    'success': false,
                    'error': `Unexpected error on ${url}`,
                }
            }
            return response.json();
        })
        .catch((error) => {
            return {
                'success': false,
                'error': error.message,
            }
        });
}

export function getUsername(setHowToPlayOpen) {
    if (localStorage.getItem('username')) {
        return localStorage.getItem('username');
    }
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < 16; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    localStorage.setItem('username', result);
    setHowToPlayOpen && setHowToPlayOpen(true);
    return result;
}

export function sample(array, num) {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

