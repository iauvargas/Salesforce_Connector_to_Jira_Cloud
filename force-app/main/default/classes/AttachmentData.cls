public class AttachmentData {
    @AuraEnabled
    public String filename { get; set; }
    @AuraEnabled
    public String authorDisplayName { get; set; }
    @AuraEnabled
    public String created { get; set; }
    @AuraEnabled
    public Integer size { get; set; }
    @AuraEnabled
    public String mimeType { get; set; }
    @AuraEnabled
    public String contentUrl { get; set; }
}