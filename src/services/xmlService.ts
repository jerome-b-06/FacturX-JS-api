import he from 'he';
import type {Company, Customer, Invoice, Item} from "../generated/prisma/client.js";

export const XmlService = {

    generateCIIXml: (customer: Customer, company: Company, invoice: Invoice, items: Item[]): string => {
        const escape = (str: string) => he.encode(str || '');
        const formatDate = (date: Date) => date.toISOString().split("T")[0]?.replaceAll("-", "");

        const totalHT = invoice.totalHT.toFixed(2);
        const totalVAT = invoice.totalVAT.toFixed(2);
        const totalTTC = invoice.totalTTC.toFixed(2);

        return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice 
    xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" 
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" 
    xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" 
    xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
    
    <rsm:ExchangedDocumentContext>
        <ram:GuidelineSpecifiedDocumentContextParameter>
            <ram:ID>urn:factur-x.eu:1p0:basic</ram:ID>
        </ram:GuidelineSpecifiedDocumentContextParameter>
    </rsm:ExchangedDocumentContext>

    <rsm:ExchangedDocument>
        <ram:ID>${escape(invoice.invoiceNumber)}</ram:ID>
        <ram:TypeCode>380</ram:TypeCode> <ram:IssueDateTime>
            <udt:DateTimeString format="102">${formatDate(invoice.date)}</udt:DateTimeString>
        </ram:IssueDateTime>
    </rsm:ExchangedDocument>

    <rsm:SupplyChainTradeTransaction>
        ${items.map((item: Item, index: number) => `
        <ram:IncludedSupplyChainTradeLineItem>
            <ram:AssociatedDocumentLineDocument>
                <ram:LineID>${index + 1}</ram:LineID>
            </ram:AssociatedDocumentLineDocument>
            <ram:SpecifiedTradeProduct>
                <ram:Name>${escape(item.description)}</ram:Name>
            </ram:SpecifiedTradeProduct>
            <ram:SpecifiedLineTradeAgreement>
                <ram:NetPriceProductTradePrice>
                    <ram:ChargeAmount>${item.unitPrice.toFixed(2)}</ram:ChargeAmount>
                </ram:NetPriceProductTradePrice>
            </ram:SpecifiedLineTradeAgreement>
            <ram:SpecifiedLineTradeDelivery>
                <ram:BilledQuantity unitCode="C62">${item.quantity}</ram:BilledQuantity>
            </ram:SpecifiedLineTradeDelivery>
            <ram:SpecifiedLineTradeSettlement>
                <ram:ApplicableTradeTax>
                    <ram:TypeCode>VAT</ram:TypeCode>
                    <ram:CategoryCode>S</ram:CategoryCode> <ram:RateApplicablePercent>${item.vatRate}</ram:RateApplicablePercent>
                </ram:ApplicableTradeTax>
                <ram:SpecifiedTradeSettlementLineMonetarySummation>
                    <ram:LineTotalAmount>${(item.totalHT).toFixed(2)}</ram:LineTotalAmount>
                </ram:SpecifiedTradeSettlementLineMonetarySummation>
            </ram:SpecifiedLineTradeSettlement>
        </ram:IncludedSupplyChainTradeLineItem>`).join('')}

        <ram:ApplicableHeaderTradeAgreement>
            <ram:SellerTradeParty>
                <ram:Name>${escape(company.name)}</ram:Name>
                <ram:SpecifiedLegalOrganization>
                    <ram:ID schemeID="0002">${escape(company.siret)}</ram:ID>
                </ram:SpecifiedLegalOrganization>
                <ram:PostalTradeAddress>
                    <ram:PostcodeCode>${escape(company.zipCode)}</ram:PostcodeCode>
                    <ram:LineOne>${escape(company.address)}</ram:LineOne>
                    <ram:CityName>${escape(company.city)}</ram:CityName>
                    <ram:CountryID>${escape(company.countryCode)}</ram:CountryID>
                </ram:PostalTradeAddress>
                <ram:SpecifiedTaxRegistration>
                    <ram:ID schemeID="VA">FR${escape(company.siret.substring(0, 9)) /* Simplified VAT */}</ram:ID>
                </ram:SpecifiedTaxRegistration>
            </ram:SellerTradeParty>

            <ram:BuyerTradeParty>
                <ram:Name>${escape(customer.name)}</ram:Name>
                <ram:SpecifiedLegalOrganization>
                    <ram:ID schemeID="0002">${escape(customer.siret || '')}</ram:ID>
                </ram:SpecifiedLegalOrganization>
                <ram:PostalTradeAddress>
                    <ram:PostcodeCode>${escape(customer.zipCode)}</ram:PostcodeCode>
                    <ram:LineOne>${escape(customer.address)}</ram:LineOne>
                    <ram:CityName>${escape(customer.city)}</ram:CityName>
                    <ram:CountryID>${escape(customer.countryCode)}</ram:CountryID>
                </ram:PostalTradeAddress>
                <ram:SpecifiedTaxRegistration>
                    <ram:ID schemeID="VA">FR${escape(customer.vatNumber || '')}</ram:ID>
                </ram:SpecifiedTaxRegistration>
            </ram:BuyerTradeParty>
        </ram:ApplicableHeaderTradeAgreement>

        <ram:ApplicableHeaderTradeDelivery/>

        <ram:ApplicableHeaderTradeSettlement>
            <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
            
            <ram:ApplicableTradeTax>
                <ram:CalculatedAmount>${totalVAT}</ram:CalculatedAmount>
                <ram:TypeCode>VAT</ram:TypeCode>
                <ram:BasisAmount>${totalHT}</ram:BasisAmount>
                <ram:CategoryCode>S</ram:CategoryCode>
                <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent> </ram:ApplicableTradeTax>

            <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
                <ram:LineTotalAmount>${totalHT}</ram:LineTotalAmount>
                <ram:TaxBasisTotalAmount>${totalHT}</ram:TaxBasisTotalAmount>
                <ram:TaxTotalAmount currencyID="EUR">${totalVAT}</ram:TaxTotalAmount>
                <ram:GrandTotalAmount>${totalTTC}</ram:GrandTotalAmount>
                <ram:DuePayableAmount>${totalTTC}</ram:DuePayableAmount>
            </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        </ram:ApplicableHeaderTradeSettlement>

    </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
    }
};