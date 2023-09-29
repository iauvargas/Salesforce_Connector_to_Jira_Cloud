trigger CambiarStatusNuevo on Case(before insert) {
  for (Case newCase : Trigger.new) {
    if (newCase.Id == null) {
      newCase.Helpshift__Status_Detail__c = 'Open';
      newCase.OwnerId = '00G8H000002MzQgUAK';
    }
  }
  /*List<String> clientEmails = new List<String>();

    for (Case newCase : Trigger.new) {
        clientEmails.add(newCase.Correo_cliente__c);
        if (newCase.Id == null) {
            newCase.Helpshift__Status_Detail__c = 'Open';
        }
    }

	Map<String, Id> emailToContactIdMap = new Map<String, Id>();

    for (Contact contact : [SELECT Id, Email FROM Contact WHERE Email IN :clientEmails]) {
        emailToContactIdMap.put(contact.Email, contact.Id);
    }
    
    // Actualizar el campo ContactId del caso correspondiente al contacto encontrado
    for (Case newCase : Trigger.new) {
        if (emailToContactIdMap.containsKey(newCase.Correo_cliente__c)) {
            newCase.ContactId = emailToContactIdMap.get(newCase.Correo_cliente__c);
        }
    }*/
}
