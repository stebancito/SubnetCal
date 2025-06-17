
function esIPValida(ip) {
    const regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    return regex.test(ip); 
}
document.addEventListener('DOMContentLoaded', function(){


    console.log('Iniciando la aplicación...');
    const text = "Calculadora de Subneteo";
    const element = document.getElementById('typewriter-text');
    const cursor = document.getElementById('typewriter-cursor');
    let i = 0;

    function typeWriter() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 150); // Velocidad (150ms por letra)
        } else {
            cursor.style.display = 'none'; // Oculta el cursor al finalizar
        }
    }

    typeWriter(); // Inicia la animación


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
        cell1.className = "border border-gray-300  p-2";
        cell1.textContent = rowCount + 1;

        // Input de hosts
        const cell2 = newRow.insertCell(1);
        cell2.className = "border border-gray-300  p-2";
        cell2.innerHTML = `<input type="number" name="hosts${rowCount + 1}" required min="1" class="w-full border border-gray-300  rounded p-1" />`;

        // Botón eliminar
        const cell3 = newRow.insertCell(2);
        cell3.className = "border border-gray-300  px-2 py-1 text-center";
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

        // Reordenar los índices despues de eliminar
        function renumerarFilas() {
        const tableBody = document.getElementById('hostsTable').getElementsByTagName('tbody')[0];
        [...tableBody.rows].forEach((row, index) => {
            row.cells[0].textContent = index + 1;
            const input = row.querySelector('input[type="number"]');
            if (input) input.name = `hosts${index + 1}`;
        });
        }
    }

    // DOM CIDR RESULTADO

    function mostrarResultadoCIDR(resultado) {
        const resultadoDiv = document.getElementById('resultadoCIDR');
        resultadoDiv.innerHTML = ''; // Limpiar contenido previo

        // Contenedor principal
        const contenedorPrincipal = document.createElement('div');
        contenedorPrincipal.className = ' bg-blue-50 p-8 rounded-xl shadow-lg';

        const encabezado = document.createElement('div');
        encabezado.className = 'bg-blue-600 text-white p-4 rounded-t-lg -mt-8 -mx-8 mb-6';
        encabezado.innerHTML = `
            <h2 class="font-[CascadiaCode-400] text-xl font-bold">Resultados del Subneteo CIDR</h2>
            <p class="text-blue-100">Total de subredes: ${Object.keys(resultado).length}</p>
        `;
        contenedorPrincipal.appendChild(encabezado);

        // Obtener valores comunes de la primera subred
        const primeraSubred = resultado[Object.keys(resultado)[0]];
        const infoGeneral = document.createElement('div');
        infoGeneral.className = 'p-4 bg-gray-50 text-gray-700 border-t border-b border-slate-400';

        infoGeneral.innerHTML = `
            <p class="mb-1"><strong>Máscara de subred:</strong> <a class='font-mono'>${primeraSubred.mascara_subred}</a></p>
            <p><strong>Hosts por subred:</strong><a class='font-mono'> ${primeraSubred.hosts_por_subred}</a></p>
            <p><strong>Numero de saltos de subred:</strong><a class='font-mono'> ${primeraSubred.saltos_subred}</a></p>
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

    //DOM VLSM RESULTADO

    function mostrarResultadoVLSM(resultado){
        const resultadoDiv = document.getElementById('resultadoVLSM');
        resultadoDiv.innerHTML = ''; // Limpiar contenido previo

        // Contenedor principal
        const contenedorPrincipal = document.createElement('div');
        contenedorPrincipal.className = 'bg-blue-50 p-8 rounded-xl shadow-lg';

        const encabezado = document.createElement('div');
        encabezado.className = 'bg-blue-600 text-white p-4 rounded-t-lg -mt-8 -mx-8 mb-6';
        encabezado.innerHTML = `
            <h2 class="text-xl font-[CascadiaCode-400] font-bold">Resultados del Subneteo VLSM</h2>
            <p class="text-blue-100">Total de subredes: ${Object.keys(resultado).length}</p>
        `;
        contenedorPrincipal.appendChild(encabezado);

        // Obtener valores comunes de la primera subred
        const primeraSubred = resultado[Object.keys(resultado)[0]];
        const infoGeneral = document.createElement('div');
        infoGeneral.className = 'p-4 bg-gray-50 text-gray-700 border-t border-b border-slate-800';

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
                <th class="p-3 border-b border-blue-200">Mascara de subred</th>
                <th class="p-3 border-b border-blue-200"># Hosts</th>
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
                <td class="p-3 font-mono">${subred.mascara_subred}</td>
                <td class="p-3 font-mono">${subred.hosts_subred}</td>
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

        console.log(`IP ingresada (CIDR): ${direc_ip}`);
        console.log(`Mask ingresada (CIDR): ${subnet_mask}`);
        console.log(`Subredes (CIDR): ${subredes}`);

        mostrarResultadoCIDR(calcularCIDR(direc_ip, subnet_mask, subredes));

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

        mostrarResultadoVLSM(calcularVLSM(direc_ip, maskVLSM, valoresHosts));

    });


})