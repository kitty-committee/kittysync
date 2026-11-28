let visible = $state<boolean>(false);
const messages = $state<string[]>([]);

export function getVisibility() {
    return visible;
}

export function toggleVisibility() {
    visible = !visible;
}

export function getMessages() {
    return messages;
}

export function sendMessage(message: string) {
    messages.push(message);
}
