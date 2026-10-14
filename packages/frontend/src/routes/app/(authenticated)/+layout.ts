import { redirect } from '@sveltejs/kit';

// replace with code for redirecting to the login page if the user is not authenticated
export async function load({cookies}) {
    // Session cookie defined
    const sessionID = cookies.get("session")

    // If statement to redirect loggedout users
    if (!sessionID){
        redirect(307, '../login?login');
    }
    
    // userData defined
    const api = (await fetch("api/auth/sessions?session"))

    // If statement to redirect loggedout users
    if (!api.ok){
        redirect(307, '../login?login');
    }

    return {api};
}
