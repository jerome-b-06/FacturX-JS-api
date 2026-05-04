export const defaultTemplate = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .invoice-details { text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        th, td { border-bottom: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; }
        .totals { margin-top: 30px; text-align: right; }
        .total-row { font-size: 1.2em; font-weight: bold; color: #4f46e5; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>{{company.name}}</h1>
            <p>
                {{company.address}}<br>
                {{company.zipCode}} {{company.city}}<br>
                Email : {{company.email}}
            </p>
            <p>
                SIRET : {{company.siret}}<br>
            </p>
            <h2>{{customer.name}}</h2>
            <p>
                {{customer.address}}<br>
                {{customer.zipCode}} {{customer.city}}<br>
                Email : {{customer.email}}
            </p>
            <p>
                SIRET : {{customer.siret}}<br>
                N° TVA : {{customer.vatNumber}}<br>
            </p>
        </div>
        
        <div class="invoice-details">
            <h2>FACTURE</h2>
            <p>
                N° {{invoice.invoiceNumber}}<br>
                Date : {{invoice.date}}<br>
                Due date : {{invoice.dueDate}}
            </p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Qté</th>
                <th>Prix Unitaire</th>
                <th>Total HT</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            <tr>
                <td>{{this.description}}</td>
                <td>{{this.quantity}}</td>
                <td>{{this.unitPrice}} €</td>
                <td>{{this.totalHT}} €</td>
            </tr>
            {{/each}}
        </tbody>
    </table>

    <div class="totals">
        <p>Total HT : {{invoice.totalHT}} €</p>
        <p>TVA : {{invoice.totalVAT}} €</p>
        <p class="total-row">Total TTC : {{invoice.totalTTC}} €</p>
    </div>
</body>
</html>
`;