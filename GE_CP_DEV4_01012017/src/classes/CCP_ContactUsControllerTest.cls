@isTest
private class CCP_ContactUsControllerTest {
	
    static testMethod void testSendEmail(){
        CCP_ContactUsController.fetchUserDetails();
        string fileName = 'TestFile';
        string contentType = 'text/plain';
        blob fileContent = blob.valueOf('This is test file');
        string fileContentBase64 = EncodingUtil.base64Encode(fileContent);
        Id attachId = CCP_ContactUsController.saveTheChunk(fileName, fileContentBase64, contentType, null);
        fileContent = blob.valueOf('More File Content');
        fileContentBase64 = EncodingUtil.base64Encode(fileContent);
        attachId = CCP_ContactUsController.saveTheChunk(fileName, fileContentBase64, contentType, attachId);
        CCP_EmailDistributionList__c CCPDL = new CCP_EmailDistributionList__c();
        CCPDL.Name = '1';
        CCPDL.EmailAddress__c = 'test@test.com';
        CCPDL.ActionType__c = 'Report an Issue';
        CCPDL.AccountUltimateParentId__c = 'NA';
        insert CCPDL;
        string status = CCP_ContactUsController.sendEmailWithAttachment('firstName', 'lastName', 'test@email.com', '9876543210', 'Report an Issue', 'comments', attachId);
    }
}