@isTest
private class CCP_TemplateHeaderControllerTest {
    static testMethod void testfetchUserDetails(){
        string name = CCP_TemplateHeaderController.fetchUserDetails();
        string disclaimer = CCP_TemplateHeaderController.fetchDisclaimer();
    }
}