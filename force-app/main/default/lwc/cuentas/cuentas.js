import { LightningElement, api, wire } from 'lwc';
import getCuentasRelacionadas from '@salesforce/apex/ApexControllerCuenta.getCuentasRelacionadas';


export default class Cuentas extends LightningElement {
    @api casoId;
    cuentasRelacionadas;

        @wire(getCuentasRelacionadas, { casoId: '$casoId' })
        wiredCuentas({ error, data }) {
            if (data) {
                console.log(data);
                this.cuentasRelacionadas = data;
            } else if (error) {
                console.error(error);
            }
        }
}