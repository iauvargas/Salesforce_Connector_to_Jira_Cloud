import { LightningElement, track } from 'lwc';
import fetchContactoApi from './fetchContactoApi';

const columns = [
  {
    label: 'Fecha',
    fieldName: 'Date',
    type: 'date-local',
    typeAttributes: {
      year: "numeric",
      month: "long",
      day: "2-digit",
    },
    cellAttributes: { alignment: 'left' }
  },
  {
    label: 'Confirmados',
    fieldName: 'Confirmed',
    type: 'number',
    initialWidth: 122,
    cellAttributes: { alignment: 'center' }
  },
  {
    label: 'Muertes',
    fieldName: 'Deaths',
    type: 'number',
    initialWidth: 95,
    cellAttributes: { alignment: 'center' }
  },
  {
    label: 'Recuperados',
    fieldName: 'Recovered',
    type: 'number',
    initialWidth: 135,
    cellAttributes: { alignment: 'center' }
  },
  {
    label: 'Activos',
    fieldName: 'Active',
    type: 'number',
    initialWidth: 100,
    cellAttributes: { alignment: 'center' }
  },
];

class CovidStaticsApp extends LightningElement {
  @track data = [];
  @track columns = columns;
  @track search_date = {
    startDate: '',
    endDate: ''
  }
  @track showSpinner = false;
  @track lastCasesConfirmed;
  @track startDateTitle;
  @track endDateTitle;

  constructor () {
    super();
    this.inicializarFechasDeBusqueda();
  }

  async connectedCallback () {
    this.showSpinner = true;
    const data = await fetchContactoApi(this.search_date.startDate, this.search_date.endDate);
    if (data) {
      this.data = data.reverse();
      this.setTitleData(this.data);
      this.showSpinner = false;
    }else {
      console.log(`error`);
    }
  }

  setTitleData (data) {
    this.lastCasesConfirmed = data[0].Confirmed;
    this.startDateTitle = this.search_date.startDate;
    this.endDateTitle = this.search_date.endDate;
  }

  inicializarFechasDeBusqueda () {
    this.search_date.startDate = this.crearFormatoDeFecha(new Date(2020, 2, 6));
    this.search_date.endDate = this.crearFormatoDeFecha(new Date());
  }

  crearFormatoDeFecha (fecha_actual) {
    return fecha_actual.getFullYear() + '-' +
           ('0' + (fecha_actual.getMonth() + 1)).slice(-2) + '-' +
           ('0' + (fecha_actual.getDate())).slice(-2);
  }

  updateDateValues (event) {
    this.search_date[event.target.name] = event.target.value;
  }

  handleSearchStatics () {
    this.connectedCallback();
  }
}

export default CovidStaticsApp;