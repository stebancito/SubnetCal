function bitsADecimal(bitsEnUno) {
    // bitsEnUno: número de bits consecutivos en 1 desde la izquierda, en un octeto (máximo 8)
    if (bitsEnUno === 0) return 0;
    if (bitsEnUno > 8) bitsEnUno = 8;

    // Ejemplo: bitsEnUno = 7
    // Creamos un número con bitsEnUno bits a 1 seguidos desde la izquierda
    // Para octeto, usamos 8 bits: (1 << 8) = 256
    // Restamos (1 << (8 - bitsEnUno)) para dejar esos bits en 1
    return (1 << 8) - (1 << (8 - bitsEnUno));
}

function calcularSubredesCIDR(ip_octetos, octeto_a_trabajar, saltos_subred, subredes_reales, array_subredes) {
        
    for (let i = 0; i < subredes_reales; i++) {
        const subred = [];
        for (let j = 0; j < 4; j++) {
            if (j < octeto_a_trabajar) {
                subred.push(ip_octetos[j]);
            } else if (j === octeto_a_trabajar) {
                subred.push(i * saltos_subred);
            } else {
                subred.push(0);
            }
        }
        console.log(`Subred ${i + 1}: ${subred.join('.')}`);
        array_subredes.push(subred);
    }
}

function calcularDatosSubredes(array_subredes, octeto_a_trabajar, saltos_subred, hosts_por_subred, obj_resultado, bits_mask_final) {
    for (let i = 0; i < array_subredes.length; i++) {
        
        const subred = array_subredes[i];
        const ip_inicial = [...subred]

        // Suma 1 al último octeto, manejando overflow (carry)
        for (let i = 3; i >= 0; i--) {
            if (ip_inicial[i] < 255) {
                ip_inicial[i] += 1;
                break;
            } else {
                ip_inicial[i] = 0; // carry
            }
        }

        //for para llenar ip final
        const ip_final = [];
        for (let j = 0; j < 4; j++) {
            if (j < octeto_a_trabajar) {
                ip_final.push(subred[j]);
            } else if (j === octeto_a_trabajar) {
                ip_final.push(subred[j] + saltos_subred - 1); // IP final es la subred + saltos - 2
            } else if (j === 3) {
                ip_final.push(254);
            }else {
                ip_final.push(255);
            }
        }

        const ip_broadcast = [];
        //for para llenar ip broadcast
        for (let j = 0; j < 4; j++) {
            if (j < octeto_a_trabajar) {
                ip_broadcast.push(subred[j]);
            } else if (j === octeto_a_trabajar) {
                ip_broadcast.push(subred[j] + saltos_subred - 1); // IP broadcast es la subred + saltos - 1
            } else {
                ip_broadcast.push(255);
            }
        }

        const mascara_subred = [];
        //for para llenar mascara de subred
        for (let j = 0; j < 4; j++) {
            if (j < octeto_a_trabajar) {
                mascara_subred.push(255);
            } else if (j === octeto_a_trabajar) {
                mascara_subred.push(bitsADecimal(bits_mask_final % 8));
            } else {
                mascara_subred.push(0);
            }
        }

        obj_resultado[`Subred ${i + 1}`] = {
            subred: `${subred.join('.')}/${bits_mask_final}`,
            mascara_subred: mascara_subred.join('.'),
            ip_inicial: ip_inicial.join('.'),
            ip_final: ip_final.join('.'),
            ip_broadcast: ip_broadcast.join('.'),
            saltos_subred: saltos_subred,
            hosts_por_subred: hosts_por_subred
        };
    }
}

function calcularCIDR(direc_ip, subnet_mask, subredes){

    const bit_prestados = Math.ceil(Math.log2(subredes));
    const subredes_reales = Math.pow(2, bit_prestados);

    const bits_mask_final = parseInt(subnet_mask) + bit_prestados;

    //selecionamos octeto que tenga los ultimos bits de la mascara
    const bit_octeto = bits_mask_final % 8;
    const octeto_decimal = bitsADecimal(bit_octeto);

    const saltos_subred = 256 - octeto_decimal;

    //definicion de hosts por subred
    const bits_restantes = 32 - bits_mask_final;
    const hosts_por_subred = Math.pow(2, bits_restantes) - 2; // Restamos 2 por red y broadcast

    const ip_octetos = direc_ip.split('.').map(Number);
    const octeto_a_trabajar = Math.ceil(bits_mask_final / 8) - 1;

    console.log(`Dirección IP: ${ip_octetos[octeto_a_trabajar]}`);

    console.log(`Máscara decimal: ${octeto_decimal}`);
    console.log(`Saltos de subred: ${saltos_subred}`);
    console.log(`Hosts por subred: ${hosts_por_subred}`);

    const array_subredes = [];
    calcularSubredesCIDR(ip_octetos, octeto_a_trabajar, saltos_subred, subredes_reales, array_subredes);

    const obj_resultado = {};
    calcularDatosSubredes(array_subredes, octeto_a_trabajar, saltos_subred, hosts_por_subred, obj_resultado, bits_mask_final);

    console.log('Resultados:', obj_resultado);
    
    return obj_resultado;
}
