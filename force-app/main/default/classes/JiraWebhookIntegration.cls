public class JiraWebhookIntegration {
 	public void createIssueInJira(Case newCase) {
        String jiraWebhookUrl = 'https://automation.atlassian.com/pro/hooks/a915a18db46ab019e269166ab3301fb6f5851f4f';
        String jiraIssueSummary = newCase.Subject; // Puedes utilizar otros campos del caso según tus necesidades

        // Construir el cuerpo de la solicitud en formato JSON
        String jsonBody = '{"issues":[{"summary":"' + jiraIssueSummary + '"}]}';

        // Crear la solicitud HTTP POST
        HttpRequest request = new HttpRequest();
        request.setEndpoint(jiraWebhookUrl);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/json');
        request.setBody(jsonBody);

        // Enviar la solicitud HTTP
        HttpResponse response = new Http().send(request);

        // Aquí puedes realizar acciones adicionales dependiendo de la respuesta de Jira
        // Por ejemplo, verificar el código de estado (response.getStatusCode()) para asegurarte de que la solicitud se haya realizado correctamente.
    }
}