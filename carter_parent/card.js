const botonesCantidad = document.querySelectorAll(".botonesCantidadCartas")
const contenedorInicio = document.querySelector(".contenedorInicio")
const contenedorJuego = document.querySelector(".contenedorJuego")
const tablero20 = document.querySelector(".tableroJuego20")
const tablero12 = document.querySelector(".tableroJuego12")
const cartas = ["1", "1", "2", "2", "3", "3", "4", "4", "5", "5", "6", "6", "7", "7", "8", "8", "9", "9", "10", "10",]
const botonesCartas = document.querySelectorAll(".cartas")
let numCartasTablero = "0"
let elecionCorrecta = [];
let elecionCorrecta2 = [];
const textTiempo = document.querySelector(".textTiempo")
const contenedorResultado = document.querySelector(".contenedorResultado")
const tituloResultado = document.querySelector("#tituloResultado")
const tiempoFinal = document.querySelector("#tiempoResultado")
let segundos = 1
let minutos = 0
let Segundo
const botonReinicio = document.querySelector(".botonReiniciar")

botonesCantidad.forEach(botonCantidad => {
    botonCantidad.addEventListener("click", () => {
        contenedorInicio.classList.add("off");
        contenedorJuego.classList.remove("off")
        const cantidadCartas = botonCantidad.getAttribute("data-cantidad").toString();
        console.log(cantidadCartas)
        if (cantidadCartas === "12") {
            tablero20.classList.add("off")
            tablero12.classList.remove("off")
            numCartasTablero = "12"
        } else {
            tablero12.classList.add("off")
            tablero20.classList.remove("off")
            numCartasTablero = "20"
        }
        inicioJuego();
        lugaresCartas();
        tiempo();
    })
})

botonReinicio.addEventListener("click", () => {
    botonesCartas.forEach(carta => {
        carta.classList.add("off")
    })
    contenedorResultado.classList.add("off")
    contenedorInicio.classList.remove("off")
    numCartasTablero = "0"
    segundos = 1
    minutos = 0
    textTiempo.textContent = ""
})

function inicioJuego() {
    
    let click = "1"

    botonesCartas.forEach(botonCarta => {
        botonCarta.addEventListener("click", () => {
            if (!botonCarta.classList.contains("off")) {
                return;
            }
            const espacioClickeado = botonCarta.textContent
            const espacioClickeado2 = botonCarta.id
            console.log(espacioClickeado)
            if (click === "1") {
                botonCarta.classList.remove("off")
                click = "2"
                elecionCorrecta.push(espacioClickeado);
                elecionCorrecta2.push(espacioClickeado2);
                console.log(elecionCorrecta)
            } else {
                if (elecionCorrecta.includes(espacioClickeado)) {
                    botonCarta.classList.remove("off")
                    click = "1"
                    elecionCorrecta = [];
                    elecionCorrecta2 = [];
                } else {
                    botonCarta.classList.remove("off")
                    setTimeout (() => {
                        botonCarta.classList.add("off");
                        document.querySelector("#"+elecionCorrecta2).classList.add("off")
                        click = "1"
                        elecionCorrecta = [];
                        elecionCorrecta2 = [];
                    }, 500);
                }
            }
            
        })
    })
}

function lugaresCartas() {
    let camposUtilizados = [];
    let elecionRellenar = ""
    let cartaRelleno = 0
    if (numCartasTablero === "12") {
        while (camposUtilizados.length < 12) {
            do {
                elecionRellenar = Math.floor(Math.random() * 12 + 21)
            } while (camposUtilizados.includes(elecionRellenar))
            camposUtilizados.push(elecionRellenar);
            const numCarta = cartas[cartaRelleno]
            document.querySelector("#espacio" + elecionRellenar).textContent = numCarta
            cartaRelleno += 1
            console.log(cartaRelleno)
        }
    } else {
        while (camposUtilizados.length < "20") {
            do {
                elecionRellenar = Math.floor(Math.random() * 20 + 1 );
            } while (camposUtilizados.includes(elecionRellenar))
            camposUtilizados.push(elecionRellenar);
            const numCarta = cartas[cartaRelleno]
            document.querySelector("#espacio" + elecionRellenar).textContent = numCarta
            cartaRelleno += 1
            console.log(cartaRelleno)
        }
    }
}

function tiempo() {

    Segundo = setInterval(() => {

        if (segundos <= 9) {
            textTiempo.textContent = `${minutos}:0${segundos}`
            segundos += 1
        } else {
            textTiempo.textContent = `${minutos}:${segundos}`
            segundos += 1
        }
        
        if (segundos === 60) {
            segundos = 0
            minutos += 1
        }

        if (numCartasTablero === "12") {
            textTiempo.textContent += "/0:29"
            if (segundos === 30) {
                clearInterval(Segundo);
                contenedorJuego.classList.add("off")
                contenedorResultado.classList.remove("off")
                tituloResultado.textContent = "Perdiste: se agoto el tiempo"
                if (segundos <= 9) {
                    tiempoFinal.textContent = `${minutos}:0${segundos}`
                } else {
                    tiempoFinal.textContent = `${minutos}:${segundos}`
                }
            }
        } else {
            textTiempo.textContent += "/0:59"
            if (minutos === 1) {
                clearInterval(Segundo);
                contenedorJuego.classList.add("off")
                contenedorResultado.classList.remove("off")
                tituloResultado.textContent = "Perdiste: se agoto el tiempo"
                if (segundos <= 9) {
                    tiempoFinal.textContent = `${minutos}:0${segundos}`
                } else {
                    tiempoFinal.textContent = `${minutos}:${segundos}`
                }
            }
        }
        resultado();
    },1000)

}

function resultado() {
    const cartasNoDestapadas = document.querySelectorAll(".cartas.off")
    if (numCartasTablero === "12") {
        if (cartasNoDestapadas.length === 20) {
            clearInterval(Segundo);
            contenedorJuego.classList.add("off")
            contenedorResultado.classList.remove("off")
            tituloResultado.textContent = "Ganaste: descubriste todas las parejas"
            if (segundos <= 9) {
                tiempoFinal.textContent = `${minutos}:0${segundos}`
            } else {
                tiempoFinal.textContent = `${minutos}:${segundos}`
            }
        }
    } else {
        if (cartasNoDestapadas.length === 12) {
            clearInterval(Segundo);
            contenedorJuego.classList.add("off")
            contenedorResultado.classList.remove("off")
            tituloResultado.textContent = "Ganaste: descubriste todas las parejas"
            if (segundos <= 9) {
                tiempoFinal.textContent = `${minutos}:0${segundos}`
            } else {
                tiempoFinal.textContent = `${minutos}:${segundos}`
            }
        }
    }
    console.log(cartasNoDestapadas.length)
}