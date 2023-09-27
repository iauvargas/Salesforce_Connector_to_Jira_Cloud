import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import CreateIssueJira from '@salesforce/apex/CreateIssueJira.createJiraIssue';
import getCaseDetails from '@salesforce/apex/CaseController.getCaseDetails';
import createComment from '@salesforce/apex/JiraControllerComment.createComment';
import uploadAttachment from '@salesforce/apex/JiraControllerComment.uploadAttachment';
import TraerAttachments from '@salesforce/apex/JiraCommentList.TraerAttachments';
import fetchComments from '@salesforce/apex/JiraControllerComment.fetchComments';
import createadjunto from '@salesforce/apex/JiraControllerComment.createadjunto';
import cambiarEstadoCaso from '@salesforce/apex/CambiarEstadoJira.cambiarEstadoCaso';
import consultarCasosEscalados from '@salesforce/apex/CreateIssueJira.consultarCasosEscalados';
import consultarTodosEscalados from '@salesforce/apex/CreateIssueJira.consultarTodosEscalados';
import updateFechaCierre from '@salesforce/apex/CaseController.updateFechaCierre';
import { createRecord } from 'lightning/uiRecordApi';
import 'lightning/icon';

export default class EscalarJira extends LightningElement {
    @track comments = [];
    @api recordId;
    @track showSpinner = true;
    @api fileType;
    @track showForm = false;
    @track showComment = false;
    @track showRespuesta = false;
    @track showEscalar = false;
    @track showCerrado = false;
    @track issueSummary = '';
    @track Itemcoment = 0;
    @track idEscalate = '';
    @track tipologia = '';
    @track issueDescription = '';
    @track type = '';
    @track Fecha_start_Jira = '';
    @track Jira_Issue = '';
    @track newComment = '';
    @track NumeroCaso = '';
    @track variable = '';
    @track respuesta = '';
    intervalId;
    attachmentList = [];

    nombre = 'Escalación manual';
    issueJira = 'Laroc';
    numCaso = '';
    fechaInicio;

   renderedCallback() {
        if (this.recordId && !this.showForm && !this.showComment && !this.intervalId) {
            this.loadCaseDetails();
        }
        
    }
    /*renderedCallback() {
        if (this.recordId && !this.showForm && !this.showComment) {
            this.loadCaseDetails();
        }
        
    }*/
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
        console.log('Cerrado');
        clearInterval(this.intervalId);
        this.showCerrado = true;
        this.showComment = false;
    }
    disconnected() {
        clearInterval(this.intervalId);
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
                const attachmentData = event.target.result.split(',')[1];
                const attachmentFileName = file.name;

                this.uploadAttachmentToJira(attachmentData, attachmentFileName);
            };
            reader.readAsDataURL(file);
        }
    }
    async uploadAttachmentToJira(attachmentData, attachmentFileName) {
        try {
            uploadAttachment({ jiraIssueKey: this.Jira_Issue, attachmentBlob: attachmentData, attachmentFileName: attachmentFileName })
            const result = await uploadAttachmentToApex(attachmentData, attachmentFileName);
        } catch (error) {
            //console.error(error);  // Muestra detalles del error en la consola o actualiza la interfaz de usuario
        }
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
                if (this.Itemcoment < result.length) {
                    const container = this.template.querySelector('.attachment-list');
                    this.Itemcoment = result.length
                    container.innerHTML = '';

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
                //console.error('Error fetching COMMENT', error);
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
                spanElement.innerHTML = `<strong style="font-size: 18px">${contador + 1} - ${casoEscalado.Name}</strong>`;
                cardItem.appendChild(spanElement);
    
                if (casoEscalado.Fecha_cierre__c === undefined) {
                    const dateElementIni = document.createElement('div');
                    dateElementIni.innerHTML = `<FONT COLOR="purple">${casoEscalado.Issue_Jira__c} - En Proceso</FONT>`;
                    cardItem.appendChild(dateElementIni);
                } else {
                    const dateElementfin = document.createElement('div');
                    dateElementfin.innerHTML = `<FONT COLOR="green">${casoEscalado.Issue_Jira__c} - Cerrado</FONT>`;
                    cardItem.appendChild(dateElementfin);
                }
    
                // Agrega el controlador de evento usando addEventListener
                cardItem.addEventListener('click', () => {
                    if (casoEscalado.Fecha_cierre__c === undefined) {
                        if (casoEscalado.Name === 'Gestión Externa'){
                            this.showComment = false;
                            this.showEscalar = true;
                            this.disconnected();
                        }else{
                            this.showEscalar = false;
                            this.showSpinner = true;
                            this.Itemcoment = 0;
                            this.loadComments(casoEscalado.Issue_Jira__c);
                            this.startInterval();
                        }
                    
                    }else{
                        if (casoEscalado.Name === 'Gestión Externa'){
                            this.showComment = false;
                            this.showEscalar = false;
                            this.disconnected();
                        }else{
                            this.showEscalar = false;
                            this.showSpinner = true;
                            this.Itemcoment = 0;
                            this.showComment = true;
                            this.showCerrado = false;
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
                cambiarEstadoCaso({ casoId: this.recordId, Status: 'Close' })
                .then(result => {
                   
                })
                .catch(error => {
                    //console.error('Error fetching EstadodeCaso', error);
                });
            }
            if (comment.text && comment.text !== 'Close' ) {
                this.isButtonDisabled = false;
                const commentItem = document.createElement('li');
                const chatMessage = document.createElement('div');
                const messageBody = document.createElement('div');
                const messageText = document.createElement('div');
        
            if (comment.displayName === 'Israel Adonis Urbina Vargas') {
                commentItem.classList.add('slds-chat-listitem', 'slds-chat-listitem_outbound', 'slds-chat-message__text_outbound-agent');
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
        
            if (comment.displayName !== 'Israel Adonis Urbina Vargas') {
                const messageMeta = document.createElement('div');
                messageMeta.classList.add('slds-chat-message__meta');
                messageMeta.textContent = `${comment.displayName} • ${comment.fecha}`; // Ajusta según tus necesidades
                messageBody.appendChild(messageMeta);
            }
        
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
     variableFunctionMapping = {
        D2B: ['PS','Manual','disconnectedCallback'],
        Anulacion: ['ASYE','Manual', 'PS', 'disconnectedCallback'],
    };

    async handleVariableChange(variable) {
        this.isButtonDisabled = false;
        const functionsToExecute = this.variableFunctionMapping[variable];

        if (functionsToExecute) {
            for (const funcName of functionsToExecute) {
                try {
                    const conditionMet = await this[funcName]();
                    if (!conditionMet) {
                        break; // Detener la ejecución de funciones posteriores
                    }
                } catch (error) {
                    //console.error('Error en la función', funcName, error);
                    break; // Detener la ejecución en caso de error
                }
            }
        } else {
            console.log('No hay registros de Escalacion');
        }
    }
    /***********************************************************************
    async PS() {
        const Area = 'Pruebas Salesforce';
        const cardElement = this.template.querySelector('[data-id="miCard"]');
        if (cardElement) {
            cardElement.title = 'Deseas Escalar a ' + Area;
        }
        this.showRespuesta = true;
        const Proyecto = 'PS';
        const cola = 'Caso_Salesforce';
        try {
            const result = await consultarCasosEscalados({ numCaso: this.NumeroCaso, Proyecto: Proyecto });
            const casoEscalado = result[0];
            if (result && result.length === 0) {
                this.showRespuesta = true;
                this.CreaUtoJiraIssue(Proyecto, cola, Area);
                this.CargarNumeros();
                this.loadComments(this.Jira_Issue);
                return false;
            } else if (casoEscalado.Fecha_cierre__c !== undefined) {
                this.CargarNumeros();
                return true;
            } else {
                this.Jira_Issue = casoEscalado.Issue_Jira__c;
                this.Fecha_start_Jira = casoEscalado.Fecha_inicio__c;
                this.showComment = true;
                this.CargarNumeros();
                this.loadComments(this.Jira_Issue);
                casoEscalado = '';
                return false;
            }
        }catch (error) {
            return false;
        }
    }
    /************************************************************************
    async ASYE() {
        const Area = 'Administrcion de Sistemas';
        const Proyecto = 'ASYE';
        const cola = 'ASYE - Salesforce - CRM';
        try {
            const result = await consultarCasosEscalados({ numCaso: this.NumeroCaso, Proyecto: Proyecto });
            const casoEscalado = result[0];
            if (result && result.length === 0) {
                this.CreaUtoJiraIssue(Proyecto, cola, Area);
                this.CargarNumeros();
                this.loadComments(this.Jira_Issue);
                return false;
            } else if (casoEscalado.Fecha_cierre__c !== undefined) {
                this.CargarNumeros();
                return true;
            } else {
                this.Jira_Issue = casoEscalado.Issue_Jira__c;
                this.Fecha_start_Jira = casoEscalado.Fecha_inicio__c;
                this.showComment = true;
                this.CargarNumeros();
                this.loadComments(this.Jira_Issue);
                casoEscalado = '';
                return false;
            }
        } catch (error) {
            //console.error('Error fetching ASYE', error);
            return false;
        }
    }
    /************************************************************************/
    async Manual() {
        this.showComment = false;
        const Proyecto = 'Gestión Externa';
        const cardElement = this.template.querySelector('[data-id="miCard"]');
        if (cardElement) {
            cardElement.title = 'Deseas Escalar a ' + Proyecto;
        }
        const currentDate = new Date();
        const formattedDateWithOffset = currentDate.toISOString() + "+0000";
        
        try {
            const result = await consultarCasosEscalados({ numCaso: this.NumeroCaso, Proyecto: Proyecto });
            const casoEscalado = result[0];
    
            if (result && result.length === 0) {
                this.showRespuesta = true;
    
                if (this.respuesta === 'ok') {
                    const fields = {
                        Name: Proyecto,
                        Num_Caso__c: this.NumeroCaso,
                        Issue_Jira__c: 'Escalación ' + this.NumeroCaso,
                        Fecha_inicio__c: formattedDateWithOffset
                    };
    
                    await this.createRecordAndHandleToast(fields, 'Éxito', 'Escalación manual creada exitosamente');
                    this.showEscalar = true;
                    this.showRespuesta = false;
                    this.disconnected();
                } else if (this.respuesta === 'no') {
                    const fields = {
                        Name: 'Gestión Externa',
                        Num_Caso__c: this.NumeroCaso,
                        Issue_Jira__c: 'Omitida ' + this.NumeroCaso,
                        Fecha_inicio__c: formattedDateWithOffset,
                        Fecha_cierre__c: formattedDateWithOffset
                    };
    
                    await this.createRecordAndHandleToast(fields, 'Éxito', 'Area Omitida exitosamente');
                    this.showRespuesta = false;
                    return true;
                }
                this.respuesta = '';
                this.Jira_Issue = Proyecto;
            } else if (casoEscalado.Fecha_cierre__c !== undefined) {
                console.log('True');
                this.CargarNumeros();
                return true;
            } else {
                this.respuesta = '';
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
            this.respuesta = 'no';
            this.showRespuesta = false;
            this.startInterval();
            console.log('Confirmación Rechazada');
        })
        .catch(error => {
            //console.error('Error al actualizar la fecha:', error);
        });
    }
    handleConfirm() {
        this.respuesta = 'ok';
        this.showRespuesta = false;
        console.log('Confirmación Aprobada');
    }
    handleCancel() {
        this.respuesta = 'no';
        this.showRespuesta = false;
        console.log('Confirmación cancelada');
    }
    async handleEscalation(areaValue, Proyecto, cola) {
        try {
            console.log('Respues', this.NumeroCaso, Proyecto, areaValue, this.respuesta);
            const result = await consultarCasosEscalados({ numCaso: this.NumeroCaso, Proyecto: areaValue })
            const casoEscalado = result[0];
            if (result && result.length === 0) {
                this.showComment = false;
                this.showRespuesta = true;
                this.template.querySelector('[data-id="miCard"]').setAttribute('title', 'Deseas Escalar a ' + areaValue);
                this.disconnected();
                switch (this.respuesta) {
                    case 'ok':
                        this.CreaUtoJiraIssue(Proyecto, cola, areaValue);
                        this.respuesta = '';
                        return false;
                    case 'no':
                        console('Mas tarde');
                    default:
                        this.CargarNumeros();
                        return false;
                }     
            } else if (casoEscalado.Fecha_cierre__c !== undefined) {
                console.log('Respuesta', this.respuesta);
                this.CargarNumeros();
                return true;
            } else {
                this.showRespuesta = false;
                this.Jira_Issue = casoEscalado.Issue_Jira__c;
                this.Fecha_start_Jira = casoEscalado.Fecha_inicio__c;
                this.showComment = true;
                this.CargarNumeros();
                this.loadComments(this.Jira_Issue);
                casoEscalado = '';
                return false;
            }
        } catch (error) {
            return false;
        }
    }
    
    async PS() {
        const areaValue = 'Pruebas Salesforce';
        const Proyecto = 'PS';
        const cola = 'Caso_Salesforce';
        return this.handleEscalation(areaValue, Proyecto, cola);
    }
    
    async ASYE() {
        const areaValue = 'Administrcion de Sistemas';
        const Proyecto = 'ASYE';
        const cola = 'ASYE - Salesforce - CRM';
        return this.handleEscalation(areaValue, Proyecto, cola);
    }
    async createRecordAndHandleToast(fields, successTitle, successMessage) {
        try {
            const recordInput = { apiName: 'Caso_Escalado__c', fields };
            const result = await createRecord(recordInput);
    
            if (result) {
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
}