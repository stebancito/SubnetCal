function calcularSubredesVLSM(ip_base, octetos_a_trabajar, saltos_subredes) {
    const subredes = [];
    let ip_actual = [...ip_base];
    console.group('Debug - calcularSubredesVLSM');
    console.log('IP base:', ip_base.join('.'));
    console.log('Octetos a trabajar:', octetos_a_trabajar);
    console.log('Saltos de subred:', saltos_subredes);

    for (let i = 0; i < saltos_subredes.length; i++) {
        console.group(`Iteración ${i}`);
        console.log('IP actual:', ip_actual.join('.'));
        console.log('Trabajando octeto:', octetos_a_trabajar[i], 'con salto:', saltos_subredes[i]);

        // Guardar copia antes de modificar
        subredes.push([...ip_actual]);
        console.log('Subred guardada:', [...ip_actual].join('.'));

        const octeto_obj = octetos_a_trabajar[i];
        const salto = saltos_subredes[i];

        // Suma al octeto objetivo
        const valor_original = ip_actual[octeto_obj];
        ip_actual[octeto_obj] += salto;
        console.log(`Suma en octeto ${octeto_obj}: ${valor_original} + ${salto} = ${ip_actual[octeto_obj]}`);

        // Manejo de carry
        let j = octeto_obj;
        while (j >= 0 && ip_actual[j] > 255) {
            console.group(`Manejo de carry en octeto ${j}: ${ip_actual[j]}`);
            const carry = Math.floor(ip_actual[j] / 256);
            ip_actual[j] %= 256;
            console.log(`Nuevo valor octeto ${j}: ${ip_actual[j]}, carry: ${carry}`);

            if (j > 0) {
                console.log(`Aplicando carry ${carry} al octeto ${j-1} (antes: ${ip_actual[j-1]})`);
                ip_actual[j-1] += carry;
                console.log(`Octeto ${j-1} después: ${ip_actual[j-1]}`);
            } else {
                console.error("Overflow en dirección IP");
            }
            j--;
            console.groupEnd();
        }

        console.log('IP después de operación:', ip_actual.join('.'));
        console.groupEnd();
    }

    console.log('Resultado final de subredes:');
    subredes.forEach((subred, idx) => console.log(`${idx}: [${subred.join(',')}]`));
    console.groupEnd();
    return subredes;
}

function calcularDatosVLSM(subredes, octetos_a_trabajar, saltos_subredes, valoresHosts, bits_mask_nuevas) {
    const resultado = {};

    for(let i = 0; i < subredes.length; i++) {
        const subred = subredes[i];
        const salto = saltos_subredes[i];

        // IP inicial (subred + 1)
        const ip_inicial = [...subred];
        for (let j = 3; j >= 0; j--) {
            if (ip_inicial[j] < 255) {
                ip_inicial[j]++;
                break;
            } else {
                ip_inicial[j] = 0;
            }
        }

        const ip_broadcast = [...subredes[i]];
        const octeto = octetos_a_trabajar[i];

        let suma = ip_broadcast[octeto] + salto - 1;
        if (suma > 255) {
            const carry = Math.floor(suma / 256);
            ip_broadcast[octeto] = suma % 256;
            
            if (octeto > 0) {
                ip_broadcast[octeto-1] += carry;
                // Verificar overflow en octeto superior
                if (ip_broadcast[octeto-1] > 255) {
                    ip_broadcast[octeto-1] %= 256;
                    if (octeto > 1) ip_broadcast[octeto-2] += 1;
                }
            }
        } else {
            ip_broadcast[octeto] = suma;
        }

        for (let j = octeto + 1; j < 4; j++) {
            ip_broadcast[j] = 255;
        }
        // IP final (broadcast - 1)
        const ip_final = [...ip_broadcast];
        for (let j = 3; j >= 0; j--) {
            if (ip_final[j] > 0) {
                ip_final[j]--;
                break;
            } else {
                ip_final[j] = 255;
            }
        }

        const mascara = [0, 0, 0, 0];
        const bits_octeto = bits_mask_nuevas[i] % 8;
        for (let j = 0; j < 4; j++) {
            mascara[j] = j < Math.floor(bits_mask_nuevas[i]/8) ? 255 : 
                        (j === Math.floor(bits_mask_nuevas[i]/8) ? 256 - Math.pow(2, 8 - bits_octeto) : 0);
        }

        resultado[`Subred ${i + 1}`] = {
            subred: `${subred.join('.')}/${bits_mask_nuevas[i]}`,
            mascara_subred: mascara.join('.'),
            ip_inicial: ip_inicial.join('.'),
            ip_final: ip_final.join('.'),
            ip_broadcast: ip_broadcast.join('.'),
            hosts_subred: valoresHosts[i],
        };
    }

    return resultado;
}

function calcularVLSM(direc_ip, maskVLSM, valoresHosts){

    valoresHosts.sort((a, b) => b - a); // Ordenar de mayor a menor
    maskVLSM = parseInt(maskVLSM, 10);

    // Agregamos enlaces 2 por cada router
    const longitudOriginal = valoresHosts.length;
    for (let i = 0; i < longitudOriginal; i++) {
        valoresHosts.push(2); 
    }

    const bit_hosts = [];

    // bits para hosts
    for (let i = 0; i < valoresHosts.length; i++) {
        bit_hosts.push(Math.ceil(Math.log2(valoresHosts[i] + 2))); // +2 por la IP de red y la IP de broadcast
    }

    // bits para subredes
    const bits_subred = bit_hosts.map(bits => 32 - maskVLSM - bits);

    const bits_mask_nuevas = bits_subred.map(bits => maskVLSM + bits);

    //selecionamos octeto que tenga los ultimos bits de la mascara y lo convertimos a decimal
    const bit_octetos_nuevas_masks =  bits_mask_nuevas.map(mask => mask % 8);
    for (let i = 0; i < bit_octetos_nuevas_masks.length; i++) {
        if (bit_octetos_nuevas_masks[i] === 0) {
            bit_octetos_nuevas_masks[i] = 8; // Si es 0, significa que es un octeto completo
        }
    }
    const octetos_nuevas_masks_decimal = bit_octetos_nuevas_masks.map(bit => bitsADecimal(bit));

    const saltos_subred = octetos_nuevas_masks_decimal.map(octeto => 256 - octeto);
    
    // octeto que tiene los bits a trabajar
    const ip_octetos = direc_ip.split('.').map(Number);
    const octetos_a_trabajar = bits_mask_nuevas.map(bit => Math.ceil(bit / 8) - 1);


    console.log("bits de hosts:", bit_hosts);
    console.log("Bits de subred:", bits_subred);
    console.log("Máscaras nuevas:", bits_mask_nuevas);
    console.log("Octetos de máscara a trabajar:", bit_octetos_nuevas_masks);

    console.log("Octetos de máscara en dcimal:", octetos_nuevas_masks_decimal);
    console.log("Saltos de subred:", saltos_subred);
    console.log("octetos a trabajar:", octetos_a_trabajar);

    const subredes = calcularSubredesVLSM(ip_octetos, octetos_a_trabajar, saltos_subred);

    const resultado = calcularDatosVLSM(subredes, octetos_a_trabajar, saltos_subred, valoresHosts, bits_mask_nuevas);

    console.log('Resultados:', resultado);
    return resultado;
    
}