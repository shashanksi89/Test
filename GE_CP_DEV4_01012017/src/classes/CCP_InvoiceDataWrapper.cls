public class CCP_InvoiceDataWrapper {
	@AuraEnabled
    public string InvoiceNumber;
    @AuraEnabled
    public string InvoiceDate;
    @AuraEnabled
    public date InvoiceDate_ISO;
    @AuraEnabled
    public string PONumber;
    @AuraEnabled
    public string GON;
    @AuraEnabled
    public decimal InvoiceAmount;
    @AuraEnabled
    public decimal InvoiceDueAmount;
    @AuraEnabled
    public string PaymentDueDate;
    @AuraEnabled
    public date PaymentDueDate_ISO;
    @AuraEnabled
    public string InvoiceStatus;
    @AuraEnabled
    public string CustomerName;
    @AuraEnabled
    public string FSetNumber;
    @AuraEnabled
    Public string currencyCode;
}