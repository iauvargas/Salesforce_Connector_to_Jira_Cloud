public class JiraResponse {
    @AuraEnabled
    public String jiraTicketNumber;
    @AuraEnabled
    public Datetime jiraTicketCreationTime;
    @AuraEnabled
    public String jiraTicketCreationError;
}