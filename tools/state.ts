let USER_IDENTIFIER: string | null = null;

export function setIdentifier(id: string) {
    USER_IDENTIFIER = id;
}

export function getIdentifier() {
    return USER_IDENTIFIER;
}