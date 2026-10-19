type Teste = {
    valor: number;
}

type Teste2 = {
    numero: number;
}

function teste<T>(): T {
    return {} as T;
}