// Último nombre de entrenador para pre-rellenar formularios.

const KEY = 'pp-last-name'

export function saveName(name: string): void {
  localStorage.setItem(KEY, name)
}

export function getLastName(): string {
  return localStorage.getItem(KEY) ?? ''
}
