document.addEventListener('DOMContentLoaded', () => {
  // Asegura que el DOM esté cargado antes de ejecutar el script
  const roulette = document.getElementById("roulette");
  const ctx = roulette.getContext("2d");
  const resultMoneyDiv = document.getElementById("resultMoney");
  const resultNumberDiv = document.getElementById("resultNumber");
  const spinBtn = document.getElementById("spin-btn");

  const numeros = Array.from({ length: 37 }, (_, i) => i); // 0–36
  let girando = false;
  let saldo = parseInt(document.getElementById("ingresos").value || "0", 10);
  let apuestas = [];
  let bets = new Set();

  // FUNCIONES DE COLOR
  function esRojo(n) {
    return [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n);
  }
  function esNegro(n) {
    return n !== 0 && !esRojo(n);
  }

  function RuletaVision() {
    const radio = roulette.width / 2;
    const angulo = (2 * Math.PI) / numeros.length;

    numeros.forEach((n, i) => {
      ctx.beginPath();
      ctx.moveTo(radio, radio);
      ctx.fillStyle = n === 0 ? "green" : esRojo(n) ? "red" : "black";
      ctx.arc(radio, radio, radio, i * angulo, (i + 1) * angulo);
      ctx.fill();
    });
  }
  RuletaVision();

  // GIRO DE RULETA 
  spinBtn.addEventListener("click", () => {
    if (girando || bets.size === 0) {
      resultMoneyDiv.innerHTML = '<span style="color: red; font-weight: bold;">Error: No hay apuestas</span>';
      return;
    }

    girando = true;
    const valorFicha = parseInt(document.getElementById("valor-ficha").value, 10);
    if (isNaN(valorFicha) || valorFicha <= 0) {
      resultMoneyDiv.innerHTML = '<span style="color: red; font-weight: bold;">Error: Ingrese un valor válido para la ficha</span>';
      girando = false;
      return;
    }

    const totalApostado = valorFicha * bets.size;
    if (totalApostado > saldo) {
      resultMoneyDiv.innerHTML = '<span style="color: red; font-weight: bold;">Error: Saldo insuficiente</span>';
      girando = false;
      return;
    }

    saldo -= totalApostado;

    const duracion = Math.random() * 4000 + 2000; // 2–6 s
    const numeroGanador = Math.floor(Math.random() * 37);
    const rotacionFinal = 360 * 10 + (numeroGanador * (360 / 37));

    roulette.style.transition = `transform ${duracion / 1000}s ease-out`;
    roulette.style.transform = `rotate(${rotacionFinal}deg)`;

    // Determinar color ganador
    let colorGanador;
    if (numeroGanador === 0) colorGanador = "green";
    else if (esRojo(numeroGanador)) colorGanador = "red";
    else colorGanador = "black";

    setTimeout(() => {
      girando = false;
      roulette.style.transition = "none";
      roulette.style.transform = "rotate(0deg)";
      resultNumberDiv.innerHTML = `Número ganador: <span style="color: ${colorGanador}; font-weight: bold;">${numeroGanador}</span>`;
      calcularGanancias(numeroGanador, colorGanador);
      setTimeout(reinicio, 20000); // reinicio después de mostrar resultados
    }, duracion);
  });

  // INICIO TABLA
  const table = document.getElementById('tablaRuleta');
  const clearBtn = document.getElementById('clear-btn');
  const numbersList = document.getElementById('numbers-list');
  const valor = document.getElementById('valor-ficha');

  function getColor(num) {
    if (num === 0) return 'green';
    const rojos = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    return rojos.includes(num) ? 'red' : 'black';
  }

  // Celdas
  const zeroCell = document.createElement('div');
  zeroCell.className = `cell ${getColor(0)}`;
  zeroCell.textContent = '0';
  zeroCell.dataset.number = '0';
  zeroCell.addEventListener('click', toggleBet);
  table.appendChild(zeroCell);

  for (let col = 0; col < 12; col++) {
    for (let fila = 0; fila < 3; fila++) {
      const numero = col * 3 + fila + 1;
      if (numero <= 36) {
        const cell = document.createElement('div');
        cell.className = `cell ${getColor(numero)}`;
        cell.textContent = numero;
        cell.dataset.number = numero;
        cell.addEventListener('click', toggleBet);
        table.appendChild(cell);
      }
    }
  }

  document.querySelectorAll('#outsideBets .cell').forEach(cell => {
    cell.addEventListener('click', toggleBet);
  });

  // SELECCIONAR APUESTAS
  function toggleBet(e) {
    const target = e.target;
    let key;

    if (target.dataset.number !== undefined) {
      key = `num-${target.dataset.number}`;
    } else if (target.dataset.bet !== undefined) {
      key = `bet-${target.dataset.bet}`;
    } else {
      return;
    }

    if (bets.has(key)) {
      bets.delete(key);
      target.classList.remove('selected');
    } else {
      bets.add(key);
      target.classList.add('selected');
    }

    actualizarVista();
  }

  clearBtn.addEventListener('click', () => {
    bets.clear();
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('selected'));
    actualizarVista();
  });

  function actualizarVista() {
    const lista = Array.from(bets);
    numbersList.textContent = lista.length ? lista.join(', ') : 'No hay apuestas';
  }

  // CALCULAR GANANCIAS
  function calcularGanancias(numeroGanador, colorGanador) {
    const valorFicha = parseInt(valor.value, 10);
    let ganancias = 0;
    const totalApostado = valorFicha * bets.size;

    bets.forEach((key) => {
      if (key.startsWith('num-')) {
        const apuesta = parseInt(key.split('-')[1], 10);
        if (apuesta === numeroGanador) ganancias += valorFicha * 36;
      } else if (key.startsWith('bet-')) {
        const betType = key.split('-')[1];
        let payout = 0;
        let matches = false;

        if (betType === 'red' && colorGanador === 'red') { payout = 1; matches = true; }
        else if (betType === 'black' && colorGanador === 'black') { payout = 1; matches = true; }
        else if (betType === 'even' && numeroGanador % 2 === 0 && numeroGanador !== 0) { payout = 1; matches = true; }
        else if (betType === 'odd' && numeroGanador % 2 === 1) { payout = 1; matches = true; }
        else if (betType === 'low' && numeroGanador >= 1 && numeroGanador <= 18) { payout = 1; matches = true; }
        else if (betType === 'high' && numeroGanador >= 19 && numeroGanador <= 36) { payout = 1; matches = true; }

        else if (betType === '1st12' && numeroGanador >= 1 && numeroGanador <= 12) { payout = 2; matches = true; }
        else if (betType === '2nd12' && numeroGanador >= 13 && numeroGanador <= 24) { payout = 2; matches = true; }
        else if (betType === '3rd12' && numeroGanador >= 25 && numeroGanador <= 36) { payout = 2; matches = true; }

        const col1Nums = [1,4,7,10,13,16,19,22,25,28,31,34];
        const col2Nums = [2,5,8,11,14,17,20,23,26,29,32,35];
        const col3Nums = [3,6,9,12,15,18,21,24,27,30,33,36];

        if (betType === 'col1' && col1Nums.includes(numeroGanador)) { payout = 2; matches = true; }
        else if (betType === 'col2' && col2Nums.includes(numeroGanador)) { payout = 2; matches = true; }
        else if (betType === 'col3' && col3Nums.includes(numeroGanador)) { payout = 2; matches = true; }

        if (matches) ganancias += valorFicha * (payout + 1);
      }
    });

    saldo += ganancias;
    const variacion = ganancias - totalApostado;
    const colorVariacion = variacion >= 0 ? 'green' : 'red';
    resultMoneyDiv.innerHTML = `
      Ganancias: <span style="color: green; font-weight: bold;">${ganancias}</span><br>
      Pérdida/Ganancia neta: <span style="color: ${colorVariacion}; font-weight: bold;">${variacion}</span>
    `;
  }

  // REINICIO DESPUÉS DE CADA GIRO
  function reinicio() {
    bets.clear();
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('selected'));
    actualizarVista();
    resultMoneyDiv.innerHTML = '';
    resultNumberDiv.innerHTML = '';
  }
});
