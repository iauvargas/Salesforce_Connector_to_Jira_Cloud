import { LightningElement, api , track } from 'lwc';
import createComment from '@salesforce/apex/JiraControllerComment.createComment';
import getCaseDetails from '@salesforce/apex/CaseController.getCaseDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ChatComponent extends LightningElement {
    @track newComment = '';
    @api recordId;
    Jira_Issue__c; // Variable para almacenar el ID del ticket en Jira

    renderedCallback() {
        if (this.recordId) {
            this.loadCaseDetails();
        }
    }

    loadCaseDetails() {
        getCaseDetails({ caseId: this.recordId })
            .then(result => {
                console.log(result.Jira_Issue__c);
                this.Jira_Issue__c = result.Jira_Issue__c;
            })
            .catch(error => {
                console.error('Error al cargar detalles del caso:', error);
            });
    }

    // Maneja los cambios en el cuadro de texto del comentario
    handleCommentChange(event) {
        this.newComment = event.target.value;
    }

    // Envía un nuevo comentario
    sendComment() {
        console.log('enviarcoment= ',this.Jira_Issue__c);
        createComment({ issueIdOrKey: this.Jira_Issue__c, commentText: this.newComment })
            .then((result) => {
                if (result) {
                    console.log('Coment',result);
                    // Mostrar un mensaje de éxito al enviar el comentario
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: 'No se pudo enviar el comentario a Jira.',
                            variant: 'error'
                        })
                    );
                    this.newComment.valueOf = ''; // Borra el contenido del cuadro de texto
                    this.getComments(); // Vuelve a cargar los comentarios actualizados
                } else {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Éxito',
                            message: 'Comentario enviado.',
                            variant: 'success'
                        })
                    );
                    this.newComment = ''; // Limpiar el contenido del cuadro de texto
                }
            })

            .catch(error => {
                console.error('Error al enviar el comentario', error);
            });
    }
}