public class CCP_ContactUsController {
	
    @AuraEnabled
    public static User fetchUserDetails(){
        try{
            return [Select Id, FirstName, lastName, Email from User where Id = :UserInfo.getUserId() limit 1]; 
        }catch(exception ex){
            CCP_DatabaseUtility.createErrorRecord('CCP_ContactUsController.fetchUserDetails', ex.getMessage(), userInfo.getUserId());
            throw new CCP_DatabaseUtility.applicationException(ex.getMessage());
            return null;
        }
    }
    
    @AuraEnabled
    public static string sendEmailWithAttachment(string firstName, string lastName, string email, string phone, string actionType, string comments, string attachId){
        try{
            system.debug('***'+attachId);
            User u = [Select Id, UserName, Email, Contact.Account.Name, Contact.Account.Primary_Address__c, Contact.Account.UCM_ID__c, Contact.Account.UltimateParentId__c from User where Id = :UserInfo.getUserId() limit 1];
            string emailHtmlBody = '<p>'+
                'Hello!'+
                '</p>'+
                '<p>'+
                (u.UserName != null?u.UserName:'')+' with registered email id '+(u.Email != null?u.Email:'')+' has contacted us.'+ 
                '</p>'+
                '<p>'+
                'Details are provided below.'+
                '</p>'+
                '<p>'+
                '<table border="1" cellspacing="0" cellpadding="5" style="width: 600px;">'+
                '<tr>'+
                '<td colspan="2">'+
                'User name: '+(u.UserName != null?u.UserName:'')+
                '</td>'+
                '</tr>'+
                '<tr>'+
                '<td width="50%">'+
                'First name: '+(firstName != null?firstName:'')+
                '</td>'+
                '<td width="50%">'+
                'Last name: '+(lastName != null?lastName:'')+
                '</td>'+
                '</tr>'+
                '<tr>'+
                '<td>'+
                'Email: '+(email != null?email:'')+
                '</td>'+
                '<td>'+
                'Phone: '+(phone != null?phone:'')+
                '</td>'+
                '</tr>'+
                '<tr>'+
                '<td>'+
                'Account: <br/>'+
                (u.Contact.Account.Name != null?u.Contact.Account.Name:'')+'  <br/>'+
                (u.Contact.Account.Primary_Address__c != null?u.Contact.Account.Primary_Address__c:'')+' <br/>'+
                '</td>'+
                '<td>'+
                'UCM ID: <br/>'+
                (u.Contact.Account.UCM_ID__c != null?u.Contact.Account.UCM_ID__c:'')+
                '</td>'+
                '</tr>'+
                '<tr>'+
                '<td colspan="2">'+
                'Description: '+(comments != null?comments:'')+
                '</td>'+
                '</tr>'+
                '</table>'+
                '</p>'+
                '<p>'+
                '<br/>myGEHealthcare Support'+
                '</p>';
            List<string> emailAddresses = new List<string>();
            set<string> emailAddressesSet = new set<string>();
            string accountUltimateParentId;
            if(actionType == 'Report an Issue'){
                accountUltimateParentId = 'NA';
            }else{
            	accountUltimateParentId = '%'+u.Contact.Account.UltimateParentId__c+'%';            
            }
            system.debug('***'+accountUltimateParentId);
            for(CCP_EmailDistributionList__c custSetting:[Select Id, EmailAddress__c from CCP_EmailDistributionList__c where ActionType__c = :actionType and AccountUltimateParentId__c like :accountUltimateParentId]){
                emailAddressesSet.add(custSetting.EmailAddress__c);
            }
            system.debug('***'+emailAddressesSet);
            emailAddresses.addAll(emailAddressesSet);
            List<OrgWideEmailAddress> owaList = [Select Id from OrgWideEmailAddress where Address = 'mygehealthcare.support@ge.com' limit 1];
            if(!emailAddresses.isEmpty()){
                List<Messaging.Emailfileattachment> fileAttachments = new List<Messaging.Emailfileattachment>();
                if(attachId != null && attachId != ''){
                    system.debug('***'+attachId);
                    for (Attachment a : [select Name, Body, BodyLength from Attachment where Id = :attachId])
                    {
                        Messaging.Emailfileattachment efa = new Messaging.Emailfileattachment();
                        efa.setFileName(a.Name);
                        efa.setBody(a.Body);
                        fileAttachments.add(efa);
                        system.debug('***'+efa);
                    }
                    system.debug('***'+fileAttachments);
                }
                Messaging.SingleEmailMessage[] emailMessages = new List<Messaging.SingleEmailMessage>();
                Messaging.SingleEmailMessage emailMsg = new Messaging.SingleEmailMessage();
                emailMsg.setHtmlBody(emailHtmlBody);
                emailMsg.setsubject('Mygehealthcare.com: Awaiting your response');
                emailMsg.setToAddresses(emailAddresses);
                if(owaList != null && owaList.size() > 0){
                    emailMsg.setOrgWideEmailAddressId(owaList[0].Id);
                }
                if(!fileAttachments.isEmpty()){
                    system.debug('***'+fileAttachments.isEmpty()+'***'+fileAttachments.size());
                    emailMsg.setFileAttachments(fileAttachments);
                }
                system.debug('***'+emailMsg);
                emailMessages.add(emailMsg);
                if(!emailMessages.isEmpty()){
                    Messaging.sendEmail(emailMessages);
                }
            }
            if(attachId != null && attachId != ''){
                Attachment att = [Select Id, ParentId from Attachment where Id = :attachId limit 1];
                delete [Select Id from Order_Header__c where Id = :att.ParentId limit 1];
            }
            return 'SUCCESS';
        }catch(exception ex){
            CCP_DatabaseUtility.createErrorRecord('CCP_ContactUsController.sendEmailWithAttachment', ex.getMessage(), userInfo.getUserId());
            throw new CCP_DatabaseUtility.applicationException(ex.getMessage());
            return null;
        }
        
    }
    
    @AuraEnabled
    public static string saveTheFile(String fileName, String base64Data, String contentType) { 
        try{
        	base64Data = EncodingUtil.urlDecode(base64Data, 'UTF-8');
        
            Order_Header__c orderHeader = new Order_Header__c(Order_Number__c = string.valueOf(system.now()));
            insert orderHeader;
            
            Attachment a = new Attachment();
            a.parentId = orderHeader.Id;
     
            a.Body = EncodingUtil.base64Decode(base64Data);
            a.Name = fileName;
            a.ContentType = contentType;
            
            insert a;
            
            return a.Id;    
        }catch(exception ex){
            CCP_DatabaseUtility.createErrorRecord('CCP_ContactUsController.saveTheFile', ex.getMessage(), userInfo.getUserId());
            throw new CCP_DatabaseUtility.applicationException(ex.getMessage());
            return null;
        }
        
    }
    
    @AuraEnabled
    public static Id saveTheChunk(String fileName, String base64Data, String contentType, String fileId) { 
        if (fileId == '' || fileId == null) {
            fileId = saveTheFile(fileName, base64Data, contentType);
        } else {
            appendToFile(fileId, base64Data);
        }
        
        return Id.valueOf(fileId);
    }
    
    private static void appendToFile(Id fileId, String base64Data) {
        try{
           base64Data = EncodingUtil.urlDecode(base64Data, 'UTF-8');
        
            Attachment a = [
                SELECT Id, Body
                FROM Attachment
                WHERE Id = :fileId
            ];
            
            String existingBody = EncodingUtil.base64Encode(a.Body);
            a.Body = EncodingUtil.base64Decode(existingBody + base64Data); 
            
            update a; 
        }catch(exception ex){
            CCP_DatabaseUtility.createErrorRecord('CCP_ContactUsController.appendToFile', ex.getMessage(), userInfo.getUserId());
            throw new CCP_DatabaseUtility.applicationException(ex.getMessage());
        }
    }
}