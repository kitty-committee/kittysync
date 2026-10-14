// place files you want to import through the `#lib` alias in this folder.
import { redirect } from '@sveltejs/kit';

export async function fetchApi(){
    const api = (await fetch("api/auth/sessions?session"))
    if (api.status == 401){
        redirect(307, '../login?login');
    }
    return api;
}