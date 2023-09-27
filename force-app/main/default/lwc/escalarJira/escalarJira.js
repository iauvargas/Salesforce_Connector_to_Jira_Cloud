import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import CreateIssueJira from '@salesforce/apex/CreateIssueJira.createJiraIssue';
import getCaseDetails from '@salesforce/apex/CaseController.getCaseDetails';
import createComment from '@salesforce/apex/JiraControllerComment.createComment';
import ConvertAttachment from '@salesforce/apex/JiraControllerComment.ConvertAttachment';
import TraerAttachments from '@salesforce/apex/JiraCommentList.TraerAttachments';
import fetchComments from '@salesforce/apex/JiraControllerComment.fetchComments';
import createadjunto from '@salesforce/apex/JiraControllerComment.createadjunto';
import cambiarEstadoCaso from '@salesforce/apex/CambiarEstadoJira.cambiarEstadoCaso';
import consultarCasosEscalados from '@salesforce/apex/CreateIssueJira.consultarCasosEscalados';
import consultarTodosEscalados from '@salesforce/apex/CreateIssueJira.consultarTodosEscalados';
import updateFechaCierre from '@salesforce/apex/CaseController.updateFechaCierre';
import getAllTipologiasAreas from '@salesforce/apex/JiraControllerComment.getAllTipologiasAreas';
import { createRecord } from 'lightning/uiRecordApi';
import 'lightning/icon';

export default class EscalarJira extends LightningElement {
    // Sección 1: Estado y visibilidad
    @track showSpinner = true;
    @track showForm = false;
    @track showComment = false;
    @track showEscalar = false;
    @track showCerrado = false;
    @track showFinish = false;
    @track showRespuesta = false;
    @track showAprobar = false;
    @track showTramite = true;

    // Sección 2: Datos del registro
    @api recordId;
    @api fileType;
    @track issueSummary = '';
    @track issueDescription = '';
    @track type = '';
    @track Fecha_start_Jira = '';
    @track Jira_Issue = '';
    @track NumeroCaso = '';
    @track variable = '';
    @track cardTitle = '';
    @track idEscalate = '';
    @track tipologia = '';
    @track newComment = '';

    // Sección 3: Comentarios y adjuntos
    @track comments = [];
    @track variableFunctionMapping = {};
    @track Itemcoment = 0;
    @track ItemAtach = 0;
    attachmentList = [];

    intervalId;


   renderedCallback() {
        if (this.recordId && !this.showForm && !this.showComment && !this.intervalId) {
            this.loadCaseDetails();
        }
        
    }
    loadCaseDetails() {
        getCaseDetails({ caseId: this.recordId })
            .then(result => {
                this.NumeroCaso = result.CaseNumber;
                this.numCaso = result.CaseNumber;
                this.issueSummary = result.Tipolog_a__c;
                this.Jira_Issue = result.Jira_Issue__c;
                this.issueDescription = result.Description;
                this.tipologia = result.Tipolog_a__c;
                this.type = result.Type;
                this.Fecha_start_Jira = result.Fecha_start_Jira__c;
                    if (result.Type === 'Trámite') {
                        this.showComment = true;
                        this.handleVariableChange(this.tipologia);
                        this.loadAttachments();
                        this.startInterval();
                    } else {
                        this.showComment = false;
                        this.showTramite = false;
                    }
            })
            .catch(error => {
                console.error('Error al cargar detalles del caso:', error);
            });
    }
    startInterval() {
        this.intervalId = setInterval(() => {
           this.handleVariableChange(this.tipologia);
           this.loadAttachments();
            
        }, 10000);
    }
    disconnectedCallback() {
        clearInterval(this.intervalId);
        this.showCerrado = true;
        this.showComment = false;
    }
    disconnected() {
        this.showAprobar = false;
        clearInterval(this.intervalId);
    }
    handleSummaryChange(event) {
        this.issueSummary = event.target.value;
    }
    handleDescriptionChange(event) {
        this.issueDescription = event.target.value;
    }
    handleCommentChange(event) {
        this.newComment = event.target.value;
    }
    sendComment() {
        this.isLoading = true;
        const currentJiraIssue = this.Jira_Issue;
        if(this.newComment === '@adjunto') {
            this.loadAdjunto();
            this.newComment = '';
        }else{
            createComment({ issueIdOrKey: currentJiraIssue, commentText: this.newComment })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Éxito',
                        message: 'Comentario enviado con éxito.',
                        variant: 'success'
                    })
                );
                this.newComment = '';
                return this.loadComments(currentJiraIssue);
            })
            .then(() => {
                this.isLoading = false; // Establece isLoading en false aquí
            })
            .catch(error => {
               //console.error('Error al enviar el comentario', error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'No se pueden enviar el comentarios.',
                        variant: 'error'
                    })
                );
            })
            this.isLoading = false;
      }
    }
    fileInputHandler(event) {
        const files = event.target.files;
    
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
    
            reader.onload = (event) => {
                const attachmentBlob = event.target.result.split(',')[1];
                const attachmentFileName = file.name;
                this.uploadAttachmentToJira(attachmentBlob, attachmentFileName);
            };
            reader.readAsDataURL(file);
        }
    }
    async uploadAttachmentToJira(attachmentBlob, attachmentFileName) {
        console.log('base64', attachmentBlob, attachmentFileName, this.Jira_Issue);
        ConvertAttachment({ jiraIssueKey: this.Jira_Issue, attachmentBlob: attachmentBlob, attachmentFileName: attachmentFileName })
        .then(result => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Éxito',
                    message: 'Adjuntos enviados con éxito.',
                    variant: 'success'
                })
            );
            this.Jira_Issue = '';
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error al enviar adjunto',
                    message: error.body.message,
                    variant: 'error'
                })
            );
            console.error('Error fetching enviar attachments', error);
        });
    }
    CreaUtoJiraIssue(projecto, cola, areaValue) {
        CreateIssueJira({ issueSummary: this.issueSummary, issueDescription: this.issueDescription, projecto: projecto, cola: cola, NumeroCaso: this.NumeroCaso, areaValue: areaValue })
        .then(result => {
            this.jiraTicketNumber = result.jiraTicketNumber;
            this.jiraTicketCreationTime = result.jiraTicketCreationTime;
            this.Fecha_start_Jira = result.jiraTicketCreationTime;
            this.Jira_Issue = result.jiraTicketNumber;
            this.showComment = true;
                let messages = 'Caso escalado correctamente. Nº de Issue • ' + this.Jira_Issue;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Éxito',
                        message: messages,
                        variant: 'success'
                    })
                );
                this.showComment = true;
                this.CargarNumeros();
                this.loadComments(this.Jira_Issue);
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error al actualizar',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
    loadAttachments(jiraIssueKey) {
        this.isLoading = true;
        TraerAttachments({jiraIssueKey})
            .then(result => {
                this.attachmentList = result;
                console.log('Resultao', result.length, '=', this.ItemAtach);
                /*if (result.length === 0) {
                    const container = this.template.querySelector('.attachment-list');
                    container.innerHTML = '';
                    this.ItemAtach = 0;
                }*/
                if (this.ItemAtach < result.length) {
                    const container = this.template.querySelector('.attachment-list');
                    this.ItemAtach = result.length
                    container.innerHTML = '';
                    this.ItemAtach = 0;

                    this.attachmentList.forEach(attachment => {

                        const divElement = document.createElement('div');
                        divElement.classList.add('attachment-item');

                        const pElement = document.createElement('p');

                        const lightningIcon = document.createElement('lightning-icon');
                        lightningIcon.setAttribute('icon-name', 'standard:attach');

                        const anchorElement = document.createElement('a');
                        anchorElement.href = attachment.contentUrl;
                        anchorElement.target = '_blank';
                        anchorElement.textContent = ` ${attachment.filename}`;

                        pElement.appendChild(lightningIcon);
                        pElement.appendChild(anchorElement);
                        divElement.appendChild(pElement);
                        container.appendChild(divElement);
                    });
                }
            })
            .catch(error => {
                //console.error('Error fetching attachments', error);
                this.isLoading = false;
            });
    }
    loadComments(jiraIssueKey) {
        fetchComments({ jiraIssueKey })
            .then(result => {
                this.comments = result;
                    if (this.comments.length > 0) {
                        this.showSpinner = false;
                        this.Cargarhtml();
                        this.loadAttachments(jiraIssueKey);
                    }else{
                        this.showSpinner = false;
                        const container = this.template.querySelector('.comments-container');
                        container.classList.add('comments-container');
                        container.style.maxHeight = '100px';
                        container.style.height = '100px';
                        container.style.overflowY = 'auto';
                        container.innerHTML = '';
                        const newParagraph = document.createElement('h3');
                        newParagraph.textContent = 'No hay Comentarios para Mostrar.';
                        container.appendChild(newParagraph);
                    }
                    this.comments='';
            })
            .catch(error => {
                console.error('Error fetching COMMENT', error);
            });
    }
    CargarNumeros() {
        consultarTodosEscalados({ numCaso: this.NumeroCaso })
        .then(result => {
            const container = this.template.querySelector('.numbers-container');
            container.classList.add('numbers-container');
            container.innerHTML = '';
    
            let contador = 0;
            result.forEach(casoEscalado => {
                const cardItem = document.createElement('button');
                cardItem.classList.add('slds-m-around_small', 'slds-app-launcher__tile-body');
                cardItem.setAttribute('data-id', 'miCard');
                cardItem.setAttribute('title', 'En Proceso');
    
                const spanElement = document.createElement('span');
                spanElement.innerHTML = `<strong style="font-size: 13px">${contador + 1} - ${casoEscalado.Name}</strong>`;
                cardItem.appendChild(spanElement);
    
                if (casoEscalado.Fecha_cierre__c === undefined) {
                    const dateElementIni = document.createElement('div');
                    dateElementIni.innerHTML = `<FONT COLOR="purple" style="font-size: 11px">${casoEscalado.Issue_Jira__c} - En Proceso</FONT>`;
                    cardItem.appendChild(dateElementIni);
                } else {
                    const diferencia = this.calcularDiferencia(casoEscalado.Fecha_inicio__c, casoEscalado.Fecha_cierre__c);
                    const dateElementfin = document.createElement('div');
                    dateElementfin.innerHTML = `<FONT COLOR="green" style="font-size: 11px">${casoEscalado.Issue_Jira__c} - Cerrado en -  ${diferencia}</FONT>`;
                    cardItem.appendChild(dateElementfin);
                }
    
                // Agrega el controlador de evento usando addEventListener
                cardItem.addEventListener('click', () => {
                    if (casoEscalado.Fecha_cierre__c === undefined) {
                        if (casoEscalado.Name === 'Entidad Externa'){
                            this.showComment = false;
                            this.showEscalar = true;
                            this.disconnected();
                        }else{
                            this.showEscalar = false;
                            this.showSpinner = true;
                            this.Itemcoment = 0;
                            this.Jira_Issue = casoEscalado.Issue_Jira__c;
                            this.loadComments(casoEscalado.Issue_Jira__c);
                            this.startInterval();
                        }
                    
                    }else{
                        if (casoEscalado.Name === 'Entidad Externa'){
                            this.showComment = false;
                            this.showEscalar = false;
                            this.disconnected();
                        }else{
                            this.showEscalar = false;
                            this.showSpinner = true;
                            this.Itemcoment = 0;
                            this.showComment = true;
                            this.showCerrado = false;
                            this.Jira_Issue = casoEscalado.Issue_Jira__c;
                            this.loadComments(casoEscalado.Issue_Jira__c);
                            this.disconnected();
                        }
                    }
                });
    
                container.appendChild(cardItem);
                contador++;
            });
        })
        .catch(error => {
            //console.error('Error fetching Numeros', error);
            this.isLoading = false;
        });
        
    }
    calcularDiferencia(fecha1, fecha2) {
        const date1 = new Date(fecha1);
        const date2 = new Date(fecha2);

        const diferenciaEnMilisegundos = Math.abs(date1 - date2);

        if (diferenciaEnMilisegundos >= 86400000) { // Si la diferencia es mayor o igual a 1 día
            const dias = Math.floor(diferenciaEnMilisegundos / 86400000);
            return `${dias} día${dias !== 1 ? 's' : ''}`;
        } else if (diferenciaEnMilisegundos >= 3600000) { // Si la diferencia es mayor o igual a 1 hora
            const horas = Math.floor(diferenciaEnMilisegundos / 3600000);
            return `${horas} hra${horas !== 1 ? 's' : ''}`;
        } else if (diferenciaEnMilisegundos >= 60000) { // Si la diferencia es mayor o igual a 1 minuto
            const minutos = Math.floor(diferenciaEnMilisegundos / 60000);
            return `${minutos} min${minutos !== 1 ? 'ts' : ''}`;
        } else { // Si la diferencia es en segundos
            const segundos = Math.floor(diferenciaEnMilisegundos / 1000);
            return `${segundos} sg${segundos !== 1 ? 'ds' : ''}`;
        }
    }
    Cargarhtml(){
        const container = this.template.querySelector('.comments-container');
        container.classList.add('comments-container');
        container.style.maxHeight = '400px';
        container.style.height = '200px';
        container.style.overflowY = 'auto';
        container.innerHTML = '';
        this.comments.forEach(comment => {
            if (comment.text === 'Close') {
                this.isButtonDisabled = true;
                this.isButtonDisablede = true;
                cambiarEstadoCaso({ casoId: this.recordId, Status: 'Close' })
                .then(result => {
                    const cardElement = this.template.querySelector('[data-id="miCard"]');
                    if (cardElement) {
                        cardElement.title = this.Jira_Issue + '_Close';
                    }
                })
                .catch(error => {
                    console.error('Error fetching EstadodeCaso', error);
                });
            }
            if (comment.text && comment.text !== 'Close' ) {
                this.isButtonDisabled = false;
                this.isButtonDisablede = false;
                const commentItem = document.createElement('li');
                const chatMessage = document.createElement('div');
                const messageBody = document.createElement('div');
                const messageText = document.createElement('div');
                commentItem.style.display = 'table';
            if (comment.displayName === 'Israel Adonis Urbina Vargas') {
                commentItem.classList.add('slds-chat-listitem', 'slds-chat-listitem_outbound', 'slds-chat-message__text_outbound');
                const avatar = document.createElement('span');
                avatar.classList.add('slds-avatar', 'slds-avatar_circle', 'slds-chat-avatar');
                const avatarInitials = document.createElement('abbr');
                avatarInitials.classList.add('slds-avatar__initials', 'slds-avatar__initials_inverse');
                avatarInitials.title = comment.displayName;
                avatarInitials.textContent = comment.displayName ? comment.displayName.substr(0, 2) : '';
                avatar.appendChild(avatarInitials);
                chatMessage.appendChild(avatar);
            } else {
                commentItem.classList.add('slds-chat-listitem', 'slds-chat-listitem_inbound', 'slds-chat-message__text_inbound');
                const avatar = document.createElement('span');
                avatar.classList.add('slds-avatar', 'slds-avatar_circle', 'slds-chat-avatar');
                const avatarInitials = document.createElement('abbr');
                avatarInitials.classList.add('slds-avatar__initials', 'slds-avatar__initials_inverse');
                avatarInitials.title = comment.displayName;
                avatarInitials.textContent = comment.displayName ? comment.displayName.substr(0, 2) : '';
                avatar.appendChild(avatarInitials);
                chatMessage.appendChild(avatar);
            }
        
                chatMessage.classList.add('slds-chat-message');
            
                messageBody.classList.add('slds-chat-message__body');
            
                messageText.classList.add('slds-chat-message__text');
                messageText.textContent = comment.text;
                messageBody.appendChild(messageText);
        
            
                const messageMeta = document.createElement('div');
                    if (comment.displayName === 'Israel Adonis Urbina Vargas') {
                    messageMeta.classList.add('slds-chat-message__meta', 'slds-text-color_inverse');
                    }else{
                        messageMeta.classList.add('slds-chat-message__meta');
                    }
                messageMeta.textContent = `${comment.displayName} • ${comment.fecha}`; // Ajusta según tus necesidades
                messageBody.appendChild(messageMeta);
        
            chatMessage.appendChild(messageBody);
            commentItem.appendChild(chatMessage);
            container.appendChild(commentItem);
            }
        });
    }
    loadAdjunto() {
    createadjunto({ jiraIssueKey: this.Jira_Issue, CaseKey: this.recordId})
        .then(result => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Éxito',
                    message: 'Adjuntos enviados con éxito.',
                    variant: 'success'
                })
            );
        })
        .catch(error => {
            //console.error('Error fetching enviar attachments', error);
        });
    }
    async handleVariableChange() {
        try {
            const result = await getAllTipologiasAreas({ tipologia: this.tipologia });
            let contador = 0;
            for (const record of result) {
                const areaValue = record.Area__c;
                const proyecto = record.Proyecto__c;
                const cola = record.Cola__c;
                let continueIteration = true;

                    if (proyecto === 'Entidad Externa') {
                        const results = await this.Manual(areaValue);
                        if (!results) {
                            continueIteration = false; // Detener la iteración
                            break;
                        }
                    } else {
                        const results = await this.handleEscalation(areaValue, proyecto, cola);
                        if (!results) {
                            continueIteration = false; // Detener la iteración
                            break;
                    }
                }
                contador++;
                if (contador === result.length) {
                    if (continueIteration) {
                        this.disconnectedCallback();
                    }
                }
            }
    
        } catch (error) {
            console.error('Error al actualizar la fecha:', error);
        }
        
    }
    async handleEscalation(areaValue, Proyecto, cola) {
        const currentDate = new Date();
        const formattedDateWithOffset = currentDate.toISOString() + "+0000";
        this.showFinish = false;
        try {
            const result = await consultarCasosEscalados({ numCaso: this.NumeroCaso, Proyecto: areaValue })
            const casoEscalado = result[0];
            if (result && result.length === 0) {
                this.cardTitle = 'Deseas escalar el Caso a: ' + areaValue;
                this.showComment = false;
                this.showRespuesta = true;
                switch (this.respuesta) {
                    case 'ok':
                        this.CreaUtoJiraIssue(Proyecto, cola, areaValue);
                        this.showRespuesta = false;
                        this.showAprobar = false;
                        this.showComment = true;
                        this.respuesta = '';
                        return false;
                    case 'no':
                        let fields;
                        fields = {
                            Name: areaValue,
                            Num_Caso__c: this.NumeroCaso,
                            Issue_Jira__c: Proyecto + '_N/A_' + this.NumeroCaso,
                            Fecha_inicio__c: formattedDateWithOffset,
                            Fecha_cierre__c: formattedDateWithOffset
                        };
                        await this.createRecordAndHandleToast(fields, 'Éxito', 'Area Omitida exitosamente');
                        this.CargarNumeros();
                        this.respuesta = '';
                        return true;
                    default:
                        this.CargarNumeros();
                        return false;
                }     
            }else if (casoEscalado.Fecha_cierre__c !== undefined) {
                this.CargarNumeros();
                return true;
            } else {
                this.Jira_Issue = casoEscalado.Issue_Jira__c;
                this.Fecha_start_Jira = casoEscalado.Fecha_inicio__c;
                this.CargarNumeros();
                this.loadComments(this.Jira_Issue);
                casoEscalado = '';
                return false;
            }
        } catch (error) {
            return false;
        }
    }
    /************************************************************************/
    async Manual(Proyecto) {
        const currentDate = new Date();
        const formattedDateWithOffset = currentDate.toISOString() + "+0000";
        
        try {
            const result = await consultarCasosEscalados({ numCaso: this.NumeroCaso, Proyecto: Proyecto });
            const casoEscalado = result[0];
            if (result && result.length === 0) {
                this.cardTitle = 'Deseas escalar el Caso a: ' + Proyecto;
                this.showComment = false;
                this.showRespuesta = true;
                let fields;
                switch (this.respuesta) {
                    case 'ok':
                        fields = {
                            Name: Proyecto,
                            Num_Caso__c: this.NumeroCaso,
                            Issue_Jira__c: 'Escalación ' + this.NumeroCaso,
                            Fecha_inicio__c: formattedDateWithOffset
                        };
        
                        await this.createRecordAndHandleToast(fields, 'Éxito', 'Escalación manual creada exitosamente');
                        this.showEscalar = true;
                        this.CargarNumeros();
                        this.disconnected();
                        return false;
                    case 'no':
                        fields = {
                            Name: Proyecto,
                            Num_Caso__c: this.NumeroCaso,
                            Issue_Jira__c: 'Omitida ' + this.NumeroCaso,
                            Fecha_inicio__c: formattedDateWithOffset,
                            Fecha_cierre__c: formattedDateWithOffset
                        };
        
                        await this.createRecordAndHandleToast(fields, 'Éxito', 'Area Omitida exitosamente');
                        this.CargarNumeros();
                        return true;
                    default:
                        this.respuesta = '';
                        this.CargarNumeros();
                        return false;
                }
            } else if (casoEscalado.Fecha_cierre__c !== undefined) {
                this.CargarNumeros();
                return true;
            } else {
                this.showComment = false;
                this.idEscalate = casoEscalado.Id;
                this.respuesta = '';
                this.showAprobar = false;
                this.CargarNumeros();
                this.showEscalar = true;
                this.disconnected();
            }
    
            return false;
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    }
    CerrarEscalado(){
        updateFechaCierre({ recordId: this.idEscalate })
        .then(result => {
            this.idEscalate = '';
            this.showFinish = true;
            this.showEscalar = false;
            this.CargarNumeros();
            this.startInterval();
        })
        .catch(error => {
            console.error('Error al actualizar la fecha:', error);
        });
    }
    async createRecordAndHandleToast(fields, successTitle, successMessage) {
        try {
            const recordInput = { apiName: 'Caso_Escalado__c', fields };
            const result = await createRecord(recordInput);
            if (result) {
                this.idEscalate = result.id;
                this.showRespuesta = false;
                this.showAprobar = false;
                this.respuesta = '';
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: successTitle,
                        message: successMessage,
                        variant: 'success'
                    })
                );
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
    handleConfirm() {
        this.showAprobar = true;
        this.showRespuesta = false;
        this.respuesta = 'ok';
    }
    handleCancel() {
        this.showAprobar = true;
        this.showRespuesta = false;
        this.respuesta = 'no';
    }
}