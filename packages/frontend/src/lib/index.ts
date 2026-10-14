// place files you want to import through the `#lib` alias in this folder.
import { redirect } from '@sveltejs/kit';

export async function fetchApi( url:string ){
    const api = (await fetch(url))
    if (api.status == 401){
        redirect(307, '../login?login');
    }
    return api;
}