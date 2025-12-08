let identifier: string | null = null;

export function setIdentifier(newIdentifier: string) {
    identifier = newIdentifier;
}

export function getIdentifier() {
    return identifier;
}