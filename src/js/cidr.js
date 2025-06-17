
function bitsADecimal(bitsEnUno) {

    if (bitsEnUno === 0) return 0;
    if (bitsEnUno > 8) bitsEnUno = 8;


    return (1 << 8) - (1 << (8 - bitsEnUno));
}

// Convertir el salto total a una IP válida (como si fuera una suma de bytes)
function calcularSubredesCIDR(ip_octetos, octeto_a_trabajar, saltos_subred, subredes_reales, array_subredes) {
    for (let i = 0; i < subredes_reales; i++) {
        const subred = [...ip_octetos];

        // Inicializar a cero desde el octeto a trabajar en adelante
        for (let k = octeto_a_trabajar; k < 4; k++) {
            subred[k] = 0;
        }

        let salto_total = i * saltos_subred;

        // Aplicar el salto al octeto a trabajar y propagar hacia la izquierda si se pasa de 255
        for (let j = octeto_a_trabajar; j >= 0; j--) {
            const nuevo_valor = subred[j] + (salto_total % 256);
            subred[j] = nuevo_valor % 256;
            salto_total = Math.floor(salto_total / 256) + Math.floor(nuevo_valor / 256);
        }

        array_subredes.push(subred);
    }
    console.log('Subredes calculadas:', array_subredes);
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

        const ip_final = [...ip_broadcast];
        for (let k = 3; k >= 0; k--) {
            if (ip_final[k] > 0) {
                ip_final[k] -= 1;
                break;
            } else {
                ip_final[k] = 255; // underflow hacia el octeto anterior
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

    if (bits_mask_final > 32) {
        Swal.fire({
            icon: 'error',
            title: 'Bits de máscara inválidos',
            text: `Demasiados bits de nueva mascara ${bits_mask_final}. El máximo es 32. Pruebe con una máscara menor o menos subredes.`,
        });
        return;
    }


    //selecionamos octeto que tenga los ultimos bits de la mascara
    let bit_octeto = bits_mask_final % 8;
    if (bit_octeto === 0) {
        bit_octeto = 8; // Si es 0, significa que es un octeto completo
    }
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
