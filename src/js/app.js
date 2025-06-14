


function esIPValida(ip) {
    const regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    return regex.test(ip); 
}
document.addEventListener('DOMContentLoaded', function(){


    // Initialize the app
    console.log('Iniciando la aplicación...');

    // SELECTOR DE MODO
    const radios = document.querySelectorAll('input[name="mode"]');
    const sectionCIDR = document.getElementById('sectionCIDR');
    const sectionVLSM = document.getElementById('sectionVLSM');
    let section_activa = "CIDR";

    radios.forEach((radio) => {
        radio.addEventListener('change', () => {
            if (radio.value === 'cidr') {
                sectionCIDR.classList.remove('hidden');
                sectionVLSM.classList.add('hidden');
                section_activa = "CIDR";
            } else {
                sectionCIDR.classList.add('hidden');
                sectionVLSM.classList.remove('hidden');
                section_activa = "VLSM";
            }
        });
    });

    // FUNCION PARA AGREGAR FILAS DE HOSTS EN VLSM
    {
        const nueva_fila = document.getElementById('agregarFilaB');

        nueva_fila.addEventListener('click', () => {
        const tableBody = document.getElementById('hostsTable').getElementsByTagName('tbody')[0];
        const rowCount = tableBody.rows.length;
        const newRow = tableBody.insertRow(-1);

        // Número de IP
        const cell1 = newRow.insertCell(0);
        cell1.className = "border border-gray-300 px-2 py-1";
        cell1.textContent = rowCount + 1;

        // Input de hosts
        const cell2 = newRow.insertCell(1);
        cell2.className = "border border-gray-300 px-2 py-1";
        cell2.innerHTML = `<input type="number" name="hosts${rowCount + 1}" required min="1" class="w-full border border-gray-300 rounded p-1" />`;

        // Botón eliminar
        const cell3 = newRow.insertCell(2);
        cell3.className = "border border-gray-300 px-2 py-1 text-center";
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '❌';
        deleteBtn.className = 'text-red-500 hover:text-red-700 font-bold';
        deleteBtn.type = 'button';
        
        // Evento eliminar
        deleteBtn.addEventListener('click', () => {
            newRow.remove();
            renumerarFilas();
        });

        cell3.appendChild(deleteBtn);
        });

        // Reordenar los índices (#) después de eliminar
        function renumerarFilas() {
        const tableBody = document.getElementById('hostsTable').getElementsByTagName('tbody')[0];
        [...tableBody.rows].forEach((row, index) => {
            row.cells[0].textContent = index + 1;
            const input = row.querySelector('input[type="number"]');
            if (input) input.name = `hosts${index + 1}`;
        });
        }
    }


    function mostrarResultadoCIDR(resultado) {
        const resultadoDiv = document.getElementById('resultadoCIDR');
        resultadoDiv.innerHTML = ''; // Limpiar contenido previo

        // Contenedor principal
        const contenedorPrincipal = document.createElement('div');
        contenedorPrincipal.className = 'bg-white overflow-hidden mb-8 border border-gray-400 opacity-95 shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl';

        const encabezado = document.createElement('div');
        encabezado.className = 'bg-blue-500 text-white p-4';
        encabezado.innerHTML = `
            <h2 class="text-xl font-[CascadiaCode-400] font-bold">Resultados del Subneteo CIDR</h2>
            <p class="text-blue-100">Total de subredes: ${Object.keys(resultado).length}</p>
        `;
        contenedorPrincipal.appendChild(encabezado);

        // Obtener valores comunes de la primera subred
        const primeraSubred = resultado[Object.keys(resultado)[0]];
        const infoGeneral = document.createElement('div');
        infoGeneral.className = 'p-4 bg-gray-50 text-gray-700 border-t border-b border-gray-300';

        infoGeneral.innerHTML = `
            <p class="mb-1"><strong>Máscara de subred:</strong> <a class='font-mono'>${primeraSubred.mascara_subred}</a></p>
            <p><strong>Hosts por subred:</strong><a class='font-mono'> ${primeraSubred.hosts_por_subred}</a></p>
        `;

        contenedorPrincipal.appendChild(infoGeneral);

        // Contenedor de tabla
        const tablaContainer = document.createElement('div');
        tablaContainer.className = 'overflow-x-auto p-4';

        // Tabla responsive
        const tabla = document.createElement('table');
        tabla.className = 'w-full border-collapse';

        // Encabezados de tabla
        const thead = document.createElement('thead');
        thead.className = 'bg-blue-50';
        thead.innerHTML = `
            <tr class="text-left text-blue-700">
                <th class="p-3 border-b border-blue-200">Subred</th>
                <th class="p-3 border-b border-blue-200">IP Subred</th>
                <th class="p-3 border-b border-blue-200">IP Inicial</th>
                <th class="p-3 border-b border-blue-200">IP Final</th>
                <th class="p-3 border-b border-blue-200">Broadcast</th>
            </tr>
        `;
        tabla.appendChild(thead);

        // Cuerpo de tabla
        const tbody = document.createElement('tbody');
        let cont = 1;
        Object.keys(resultado).forEach((clave) => {
            
            const subred = resultado[clave];
            const fila = document.createElement('tr');
            fila.className = 'hover:bg-blue-50 border-b border-blue-100';
            fila.innerHTML = `
                <td class="p-3 font-medium text-blue-600">${cont}</td>
                <td class="p-3 font-mono">${subred.subred}</td>
                <td class="p-3 font-mono">${subred.ip_inicial}</td>
                <td class="p-3 font-mono">${subred.ip_final}</td>
                <td class="p-3 font-mono">${subred.ip_broadcast}</td>
            `;
            tbody.appendChild(fila);

            cont++;
        });

        tabla.appendChild(tbody);
        tablaContainer.appendChild(tabla);
        contenedorPrincipal.appendChild(tablaContainer);
        resultadoDiv.appendChild(contenedorPrincipal);
    }

    //FORMULARIO CIDR

    const formCIDR = document.getElementById('subnetFormCidr');
    formCIDR.addEventListener('submit', (event) => {
        event.preventDefault();

        const direc_ip = document.getElementById('ipAddress1').value.trim();
        const subnet_mask = document.getElementById('maskCIRD').value;
        // const seleccion = document.querySelector('input[name="ipClass"]:checked');
        const subredes = document.getElementById('subredes').value;

        if (!esIPValida(direc_ip)) {
            Swal.fire({
                icon: 'error',
                title: 'Dirección IP inválida',
                text: 'Por favor ingresa una IP válida en formato IPv4, como 192.168.0.1',
                confirmButtonColor: '#3056e6',
            });
            return;
        }

        if (!subnet_mask || subnet_mask < 1 || subnet_mask > 32) {
            Swal.fire({
                icon: 'warning',
                title: 'Máscara inválida',
                text: 'Ingresa una máscara entre 1 y 32.',

            });
            return;
        }

        
        // if (!seleccion) {
        //     Swal.fire({
        //         icon: 'warning',
        //         title: 'Clase IP faltante',
        //         text: 'Debes seleccionar una clase IP (A, B o C).',
        //         confirmButtonColor: '#3056e6',
        //     });
        //     return;
        // }

        console.log(`IP ingresada (CIDR): ${direc_ip}`);
        console.log(`Mask ingresada (CIDR): ${subnet_mask}`);
        // console.log(`Clase (CIDR): ${seleccion.value}`);
        console.log(`Subredes (CIDR): ${subredes}`);

        const resultadoCIDR = calcularCIDR(direc_ip, subnet_mask, subredes);
        mostrarResultadoCIDR(resultadoCIDR);

    });

    //FORMULARIO VLSM

    const formVLSM = document.getElementById('subnetVLSM');
    formVLSM.addEventListener('submit', (event) => {
        event.preventDefault();
        const direc_ip = document.getElementById('ipAddress1VLSM').value;
        const maskVLSM = document.getElementById('maskVLSM').value;
        const tabla = document.getElementById('hostsTable');
        const inputs = tabla.querySelectorAll('tbody input[type="number"]');

        const valoresHosts = [];

        inputs.forEach((input, index) => {
            const valor = parseInt(input.value, 10);
            if (!isNaN(valor)) {
                valoresHosts.push(valor);
            } else {
                console.warn(`Fila ${index + 1}: Valor no válido`);
            }
        });

                
        if (!esIPValida(direc_ip)) {
            Swal.fire({
                icon: 'error',
                title: 'Dirección IP inválida',
                text: 'Por favor ingresa una IP válida en formato IPv4, como 192.168.0.1',
                confirmButtonColor: '#3056e6',
            });
            return;
        }


        console.log(`IP ingresada (VLSM): ${direc_ip}`);
        console.log(`Mask ingresada (VLSM): ${maskVLSM}`);
        console.log("Valores de hosts requeridos:", valoresHosts);

        //LLAMAR A FUNCION PARA CALCULAR VLSM
    });


})