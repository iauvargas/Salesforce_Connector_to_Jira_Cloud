@RestResource(urlMapping='/cambiarEstadoCaso/*')
global with sharing class CambiarEstadoCasoEndpoint {
    @HttpPost
    global static String doPost() {
        RestRequest req = RestContext.request;
        String casoId = req.params.get('casoId');
        String nuevoEstado = req.params.get('nuevoEstado');
        
        return CambiarEstadoCasoController.cambiarEstadoCaso(casoId, nuevoEstado);
    }
}