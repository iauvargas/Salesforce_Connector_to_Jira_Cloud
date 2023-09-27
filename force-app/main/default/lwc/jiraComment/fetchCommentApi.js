const ROOT_URL = 'https://cashpak.atlassian.net/rest/api/3/issue/PS-67/comment';


const fetchCommentApi = (commentText, jiraUsername, jiraApiKey) => {
    const commentBody = {
        body: {
            content: [
                {
                    content: [
                        {
                            text: commentText,
                            type: 'text'
                        }
                    ],
                    type: 'paragraph'
                }
            ],
            type: 'doc',
            version: 1
        }
    };

    return fetch(ROOT_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${btoa(`${jiraUsername}:${jiraApiKey}`)}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentBody)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al enviar el comentario');
        }
        return response.json();
    })
    .catch(error => {
        console.error('Error en la llamada a la API de Jira', error);
        throw error;
    });
};

export default fetchCommentApi;