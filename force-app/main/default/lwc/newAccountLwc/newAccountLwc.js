import { LightningElement, track } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import ACCOUNT_NAME from '@salesforce/schema/Account.Name';


class NewAccountLwc extends LightningElement {
    @track accountName;
    handlerAccountName (event) {
      this.accountName = event.target.value;
    }

    createNewAccountByName () {
      const fields = {};
      fields[ACCOUNT_NAME.fieldApiName] = this.accountName;
      const recordInput = { apiName: ACCOUNT_OBJECT.objectApiName, fields };
      createRecord(recordInput)
      .then( success => {
        console.log(`Success: ${JSON.stringify(success)}`)
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Account ha sido creado correctamente.',
                variant: 'success',
            }),
        );
        this.restartInputAccountName();
      })
      .catch( error => {
        console.log(`Error: ` + error.body.message);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: error.body.message,
                variant: 'error',
            }),
        );
      })
    }

    restartInputAccountName () {
        this.accountName = '';
    }
}

export default NewAccountLwc;