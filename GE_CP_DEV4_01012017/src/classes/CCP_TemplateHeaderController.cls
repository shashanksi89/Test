public class CCP_TemplateHeaderController {
	@AuraEnabled
    public static string fetchUserDetails(){
        return [Select Id, Name from User where Id = :UserInfo.getUserId() limit 1].Name; 
    }
    
    @AuraEnabled
    public static string fetchDisclaimer(){
        return system.label.CCP_HeaderDisclaimer;
    }
}