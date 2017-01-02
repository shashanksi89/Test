global class CCP_InvoiceUtility {
    
    public static HttpRequest getInvCustPortalInfo(String token, string UCMIDs1, String inputSearch, String sortType, String sortOrder, 
																String fromDate, String toDate, String invoiceStatusFilter, string offset, string GON, string UCMIDs2, string UCMIDs3, string UCMIDs4, string UCMIDs5, string UCMIDs6)
    {
        HttpRequest req = new HttpRequest();        
        Integration_General_Settings__c serviceReqSettings;
 
        serviceReqSettings = Integration_General_Settings__c.getValues('GEHC_InvCustPortal_API');
        boolean integEnabled;
		String endPoint;
        if(serviceReqSettings != null){
             integEnabled = serviceReqSettings.Enable_Integration__c;
            endPoint = serviceReqSettings.Endpoint__c;
        }

        if(serviceReqSettings != null && integEnabled && endPoint != null)
        {
            if(fromDate != null && fromDate != ''){
                fromDate = fromDate.replaceAll('-', '');
            }
            
            if(toDate != null && toDate != ''){
                toDate = toDate.replaceAll('-', '');
            }
            system.debug('***'+fromDate+'***'+toDate);
			InvoiceAPIObj innerReqBody = new InvoiceAPIObj();
			innerReqBody.UCM_ID1 = UCMIDs1;
			innerReqBody.UCM_ID2 = UCMIDs2;
			innerReqBody.UCM_ID3 = UCMIDs3;
			innerReqBody.UCM_ID4 = UCMIDs4;
			innerReqBody.UCM_ID5 = UCMIDs5;
			innerReqBody.UCM_ID6 = UCMIDs6;
			innerReqBody.ORDER_NUM = GON;
			innerReqBody.SEARCH_VAL = inputSearch;
			innerReqBody.SORT_COL = sortType;
			innerReqBody.SORT_ORDR = sortOrder;
			innerReqBody.SDATE = fromDate;
			innerReqBody.EDATE = toDate;
			innerReqBody.STATUS = invoiceStatusFilter;
			innerReqBody.ROWS_OFFST = offset;
			innerReqBody.MAX_ROWS_LIMT = '120';
			innerReqBody.EQP_SRV_INDCTR = 'EQUIPMENT';
            
            APIRequestBody reqBody = new APIRequestBody();
            reqBody.Invoice_API = innerReqBody;
			
			string jsonReqBody = JSON.serialize(reqBody);
            system.debug('###'+jsonReqBody);
            req.setEndpoint(endPoint);
            req.setMethod('POST');
            req.setTimeOut(120000);            
            String authorizationHeader = 'Bearer ' +token;
            req.setHeader('Authorization', authorizationHeader);
			req.setHeader('content-type', 'application/json');
			req.setBody(jsonReqBody);
            return req;
        }
        else
        {
            return null;
        }
    }
    
    public static string GetOAuth( String scope)
    {
        try
        { 
            String url;
            String client_id;
            String client_secret;
            String grant_type;        
            String token_value;
            Decimal token_expiry;
              
            OAuthCredentials__c oauth = OAuthCredentials__c.getValues( scope);
            if(oauth != null){
                url = oauth.url__c;
                grant_type = oauth.granttype__c;
                client_id = oauth.clientid__c;
                client_secret = oauth.clientsecret__c; 
             }
             
             // if connection details arent all present
             if( String.isEmpty(url) || String.isEmpty(grant_type) || String.isEmpty(client_id) || String.isEmpty(client_secret))
             {
                 System.debug('OAuth missing connection details for '+scope);
                 return null;
             }

           //A response object is generated as a result of the request  
            HTTPResponse res = RequestFromHTTP( url, grant_type, client_id, client_secret, 'api');
            
            System.debug('response_received ' + res.getBody());
            System.debug('STATUS:'+res.getStatus()+' ('+res.getStatusCode()+')');
            
            // if a success response was not received
            if( res.getStatusCode() == 400) // Invalid
            {
                System.debug('OAUTH: Incorrect credentials for scope '+scope+' - PING-server rejected request.');
                return null;
            }
            else if( res.getStatusCode() == 404) // Bad Request
            {
                System.debug('OAUTH: URL for scope '+scope+' invalid (URL: '+url+')');
                return null;       
            }
            else if( res.getStatusCode() != 200) // Anything else unsuccessful
            {
                System.debug('OAUTH: Request unsuccessful');
                return null;       
            }
            
            // Parse JSON response to get the access token
            JSONParser parser = JSON.createParser(res.getBody());
            while (parser.nextToken() != null)
            {
                // Extract Access Token from response
                if ((parser.getCurrentToken() == JSONToken.FIELD_NAME) && 
                    (parser.getText() == 'access_token')) {
                    // Get the value.
                    parser.nextToken();
                    token_value = parser.getText();
                }
                
                // Extract expiry time from server response
                if ((parser.getCurrentToken() == JSONToken.FIELD_NAME) && 
                    (parser.getText() == 'expires_in')) {
                    // Get the value.
                    parser.nextToken();
                    token_expiry = parser.getDecimalValue();
                }
            }
            system.debug(token_value);
            return token_value;
      }
      catch(Exception ex)
      {
          System.debug('OAUTH Exception:'+ ex.getMessage());
          return null;
      }    
    }
    
    public static HTTPResponse RequestFromHTTP( string url, string grant_type, string client_id, string client_secret, string scope)
    {
        //Instantiate a new http object
        Http http = new Http();
    
        //Instantiate a new HTTP request, specify the method (GET) as well as the endpoint
        HttpRequest req = new HttpRequest();
        req.setEndpoint(url);
        req.setMethod('POST');
        req.setTimeout(5000); // timeout after 5 seconds
          
        //Set HTTP Request Header
        req.setBody('grant_type='+grant_type+'&client_id='+client_id+'&client_secret='+client_secret+'&scope='+scope);
    system.debug('&&&'+req);
        //A response object is generated as a result of the request  
        return http.send(req);
    }
    
    public class APIRequestBody{
        public InvoiceAPIObj Invoice_API;
    }
	
	public class InvoiceAPIObj{
		public string UCM_ID1;
		public string UCM_ID2;
		public string UCM_ID3;
		public string UCM_ID4;
		public string UCM_ID5;
        public string UCM_ID6;
		public string XREF1;
		public string XREF2;
		public string XREF3;
		public string XREF4;
		public string ORDER_NUM;
		public string PO_NUM;
		public string FSET_NUM;
		public string BT_NAM;
		public string ST_NAM;
		public string INV_NUM;
		public string SDATE;
		public string EDATE;
		public string STATUS;
		public string EQP_SRV_INDCTR;
		public string INV_SRC_TYP;
		public string SR_NUM;
		public string CNTRCT_NUM;
		public string INV_TYP;
		public string SYS_ID;
		public string SORT_COL;
		public string SORT_ORDR;
		public string SEARCH_VAL;
		public string ROWS_OFFST;
		public string MAX_ROWS_LIMT;
	}

}