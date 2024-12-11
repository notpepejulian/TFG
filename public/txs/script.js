let currentPage = 1;
const rowsPerPage = 15;

// Cargar las transacciones desde el servidor
async function loadTransactions() {
  try {
    const response = await fetch('http://localhost:3000/transactions');
    const transactions = await response.json();

    displayTransactions(transactions, currentPage, rowsPerPage);
    addTransactionClickListeners(); // Agregar listeners para los detalles
    setupPagination(transactions.length, rowsPerPage);
  } catch (error) {
    console.error('Error al cargar las transacciones:', error);
  }
}

// Mostrar las transacciones en la tabla
function displayTransactions(transactions, page, rows) {
  const tableBody = document.getElementById('transaction-table-body');
  tableBody.innerHTML = ''; // Limpia el contenido previo
  const start = (page - 1) * rows;
  const end = Math.min(start + rows, transactions.length); // Asegura no superar el número total de transacciones
  const paginatedItems = transactions.slice(start, end); // Obtén los elementos para la página actual

  paginatedItems.forEach((transaction) => {
    const shortenedId = `${transaction.idTransaccion.slice(0, 8)}...${transaction.idTransaccion.slice(-8)}`;
    const shortenedBlock = transaction.bloque !== 'Sin Bloque' ? `${transaction.bloque}` : 'Sin Bloque';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.firma}</td>
      <td>${shortenedBlock}</td>
      <td>${transaction.fecha}</td>
      <td>${transaction.tipoOperacion}</td>
      <td>${transaction.ownerAnterior}</td>
      <td><i class="fa-solid fa-arrow-right"></i></td>
      <td>${transaction.nuevoOwner}</td>
      <td><a href="#" data-id="${transaction.idTransaccion}">${shortenedId}</a></td>
    `;
    tableBody.appendChild(row);
  });
}

// Configurar la paginación
function setupPagination(totalItems, rowsPerPage) {
  const totalPages = Math.ceil(totalItems / rowsPerPage); // Calcula el total de páginas correctamente
  const currentPageElement = document.getElementById('current-page');
  currentPageElement.textContent = `Página ${currentPage} de ${totalPages}`;

  document.getElementById('prev-page').onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      loadTransactions();
    }
  };

  document.getElementById('next-page').onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadTransactions();
    }
  };

  document.getElementById('first-page').onclick = () => {
    currentPage = 1;
    loadTransactions();
  };

  document.getElementById('last-page').onclick = () => {
    currentPage = totalPages;
    loadTransactions();
  };
}

// Añadir evento click para expandir detalles de la transacción
function addTransactionClickListeners() {
  const links = document.querySelectorAll('#transaction-table-body a[data-id]');

  links.forEach(link => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();

      const transactionId = link.dataset.id;
      const row = link.closest('tr');
      const existingDetailsRow = row.nextElementSibling;

      // Si ya existe un detalle abierto, lo cerramos
      if (existingDetailsRow && existingDetailsRow.classList.contains('details-row')) {
        existingDetailsRow.remove();
        return;
      }

      // Crear fila para mostrar detalles
      const detailsRow = document.createElement('tr');
      detailsRow.classList.add('details-row');

      try {
        const transactionData = await fetch(`http://192.168.1.100:9984/api/v1/transactions/${transactionId}`).then(res => res.json());
        const blockData = await fetch(`http://192.168.1.100:9984/api/v1/blocks?transaction_id=${transactionId}`).then(res => res.json());
        const validatorData = await fetch(`http://192.168.1.100:9984/api/v1/validators?transaction_id=${transactionId}`).then(res => res.json());

        const metadata = transactionData.asset?.data || {};
        const fulfillment = transactionData.inputs[0]?.fulfillment || 'Sin Firma';
        const blockId = blockData.length > 0 ? blockData[0] : 'Sin Bloque';
        const timestamp = transactionData.asset?.data?.timestamp || 'Sin Fecha';
        const validator = validatorData[0]?.public_key?.value || 'Sin Validador';
        const estado = '<span class="success aproved">Aproved!</span>';

        function formatTimestamp(isoTimestamp) {
          const date = new Date(isoTimestamp);
          const options = {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZoneName: "short",
          };
          return date.toLocaleString("es-ES", options).replace("GMT", "+UTC");
        }

        function timeAgo(isoTimestamp) {
          const now = new Date();
          const transactionTime = new Date(isoTimestamp);
          const diffMs = now - transactionTime; // Diferencia en milisegundos

          const diffMinutes = Math.floor(diffMs / (1000 * 60)); // Milisegundos a minutos
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60)); // Milisegundos a horas
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // Milisegundos a días

          if (diffMinutes < 60) {
            return `Hace ${diffMinutes} minutos`;
          } else if (diffHours < 24) {
            return `Hace ${diffHours} horas`;
          } else {
            return `Hace ${diffDays} días`;
          }
        }

        // Renderizar detalles en la fila
        detailsRow.innerHTML = `
          <td colspan="8" class="desplegable">
            <div class="contenedor-padre-desplegable">
              <div class="details-containerF">
                <div class="details-container left-container">
                  <div class="detail-item">
                    <i class="fa-solid fa-circle-info"></i>
                    <span class="detail-title">Firma Completa</span>
                  </div>
                  <div class="detail-item">
                    <i class="fa-solid fa-circle-info"></i>
                    <span class="detail-title">Block & Timestamp</span>
                  </div>
                  <div class="detail-item">
                    <i class="fa-solid fa-circle-info"></i>
                    <span class="detail-title">Validador</span>
                  </div>
                  <div class="detail-item">
                    <i class="fa-solid fa-circle-info"></i>
                    <span class="detail-title">Estado Txs</span>
                  </div>
                </div>
                <div class="details-container right-container">
                  <div class="detail-item">
                    <span class="detail-value">${fulfillment}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-value"><a href="#">---${blockId}---</a> | ${formatTimestamp(timestamp)} | ${timeAgo(timestamp)}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-value">${validator}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-value">${estado}</span>
                  </div>
                </div>
              </div>
              <div class="container-metadata">
                <div>
                  <span class="detail-title title-metadata">Metadata</span>
                </div>
                <pre class="markdown">${JSON.stringify(metadata, null, 2)}</pre>
              </div>
              <div class="transaction-status">
                <span class="detail-status">
                  ${
                    fulfillment !== "Sin Firma"
                      ? `<span class="success"><i class="fa-solid fa-check-circle"></i> SUCCESS! (Validaciones Correctas)</span>`
                      : `<span class="fail"><i class="fa-solid fa-times-circle"></i> Transaction FAIL!</span>`
                  }
                </span>
              </div>
            </div>
          </td>
        `;

        row.insertAdjacentElement('afterend', detailsRow);
      } catch (error) {
        console.error('Error al cargar detalles de la transacción:', error);
      }
    });
  });
}


// Cambiar entre temas de color
const themeToggle = document.getElementById('theme-toggle'); // seleccionar el botón del tema
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.classList.toggle('dark');
});

// // Configurar la paginación
// function setupPagination(totalItems, rowsPerPage) {
//   const totalPages = Math.ceil(totalItems / rowsPerPage);
//   const currentPageElement = document.getElementById('current-page');
//   currentPageElement.textContent = `Page ${currentPage} of ${totalPages}`;

//   document.getElementById('prev-page').onclick = () => {
//     if (currentPage > 1) {
//       currentPage--;
//       loadTransactions();
//     }
//   };

//   document.getElementById('next-page').onclick = () => {
//     if (currentPage < totalPages) {
//       currentPage++;
//       loadTransactions();
//     }
//   };

//   document.getElementById('first-page').onclick = () => {
//     currentPage = 1;
//     loadTransactions();
//   };

//   document.getElementById('last-page').onclick = () => {
//     currentPage = totalPages;
//     loadTransactions();
//   };
// }


// Cargar las transacciones cuando se cargue la página
window.onload = loadTransactions;