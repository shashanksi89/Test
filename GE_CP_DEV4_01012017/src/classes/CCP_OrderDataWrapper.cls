public class CCP_OrderDataWrapper {
	@AuraEnabled
    public string PONumber;
    @AuraEnabled
    public string GON;
    @AuraEnabled
    public string CustomerName;
    @AuraEnabled
    public string CustomerAddress;
    @AuraEnabled
    public string OrderInitiationDate;
    @AuraEnabled
    public string OrderApprovalDate;
    @AuraEnabled
    public date OrderApprovalDate_ISO;
    public datetime OrderApprovalDateTime;
    @AuraEnabled
    public string OrderStatus;
    @AuraEnabled
    public decimal TotalOrderValue;
    @AuraEnabled
    public List<CCP_FsetDataWrapper> Fsets;
    @AuraEnabled
    public integer statusSortCode;
    @AuraEnabled
    public date OrderInitiationDate_ISO;
    @AuraEnabled
    public string InvoiceFSet;
    @AuraEnabled
    Public decimal InvoiceFSetAmount;
    @AuraEnabled
    Public string InvoiceFSetAddress;
    @AuraEnabled
    Public string currencyCode;
    public string BTAccountUCMIds;
    public string customerCity;
    public string countryCode;
    public string cutomerState;
    public string customerZip;
    public string OrderSource;
    public string STAccountUCMIds;
    public string addressCity;
    @AuraEnabled
    public string addressLine1;
    @AuraEnabled
    public string addressLine2;
    @AuraEnabled
    public string addressLise3;
    public string addressLine4;
    public string addressState;
    public string addressZip;
    public string addressCountry;
}