import { LightningElement, wire } from 'lwc';
import getAccounts from '@salesforce/apex/CuentasRelacionadas.getAccounts';
const PAGE_SIZE = 5;

export default class Jerarquia extends LightningElement {
    accounts;
    pageNumber = 1;

    @wire(getAccounts, { pageNumber: '$pageNumber', pageSize: PAGE_SIZE })
    wiredAccounts({ data, error }) {
        if (data) {
            this.accounts = data;
        } else if (error) {
            console.error('Error retrieving accounts:', error);
        }
    }

    get isFirstPage() {
        return this.pageNumber === 1;
    }

    get isLastPage() {
        return this.accounts ? this.accounts.length < PAGE_SIZE : true;
    }

    goToPreviousPage() {
        if (!this.isFirstPage) {
            this.pageNumber--;
        }
    }

    goToNextPage() {
        if (!this.isLastPage) {
            this.pageNumber++;
        }
    }
}