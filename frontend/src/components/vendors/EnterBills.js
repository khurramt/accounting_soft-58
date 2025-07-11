import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../contexts/CompanyContext";
import billService from "../../services/billService";
import vendorService from "../../services/vendorService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Plus, 
  Trash2, 
  Save, 
  Calculator,
  FileText,
  Receipt,
  Loader2,
  AlertCircle
} from "lucide-react";

const EnterBills = () => {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  
  const [billData, setBillData] = useState({
    vendor: "",
    date: new Date().toISOString().split('T')[0],
    refNo: "",
    dueDate: "",
    terms: "Net 30",
    memo: "",
    expenses: [
      {
        id: 1,
        account: "",
        amount: 0,
        memo: "",
        billable: false
      }
    ],
    items: []
  });

  const [vendors, setVendors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load vendors and accounts on component mount
  useEffect(() => {
    if (currentCompany) {
      loadVendors();
      loadAccounts();
    }
  }, [currentCompany]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getVendors(currentCompany.company_id);
      setVendors(response.items || []);
    } catch (err) {
      setError('Failed to load vendors');
      console.error('Error loading vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      // Mock accounts for now - would integrate with accounts service when available
      const mockAccounts = [
        { id: '1', name: 'Office Supplies', type: 'Expense' },
        { id: '2', name: 'Travel & Entertainment', type: 'Expense' },
        { id: '3', name: 'Professional Services', type: 'Expense' },
        { id: '4', name: 'Utilities', type: 'Expense' },
        { id: '5', name: 'Rent', type: 'Expense' }
      ];
      setAccounts(mockAccounts);
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setBillData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExpenseChange = (index, field, value) => {
    const updatedExpenses = [...billData.expenses];
    updatedExpenses[index][field] = value;
    setBillData(prev => ({
      ...prev,
      expenses: updatedExpenses
    }));
  };

  const addExpense = () => {
    setBillData(prev => ({
      ...prev,
      expenses: [...prev.expenses, {
        id: Date.now(),
        account: "",
        amount: 0,
        memo: "",
        billable: false
      }]
    }));
  };

  const removeExpense = (index) => {
    if (billData.expenses.length > 1) {
      const updatedExpenses = billData.expenses.filter((_, i) => i !== index);
      setBillData(prev => ({
        ...prev,
        expenses: updatedExpenses
      }));
    }
  };

  const calculateTotal = () => {
    return billData.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  };

  const handleSave = async () => {
    if (!currentCompany) {
      setError('No company selected');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      if (!billData.vendor) {
        setError('Please select a vendor');
        return;
      }

      if (billData.expenses.length === 0 || !billData.expenses.some(exp => exp.account && exp.amount > 0)) {
        setError('Please add at least one expense with an account and amount');
        return;
      }

      // Create bill via API
      const response = await billService.createBill(currentCompany.company_id, billData);
      
      console.log('Bill created successfully:', response);
      navigate("/vendors", { 
        state: { 
          message: 'Bill created successfully',
          type: 'success' 
        }
      });
    } catch (err) {
      console.error('Error creating bill:', err);
      setError(err.response?.data?.detail || 'Failed to create bill');
    } finally {
      setSaving(false);
    }
  };

  const selectedVendor = vendors.find(v => v.vendor_id === billData.vendor);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enter Bills</h1>
          <p className="text-gray-600">Record bills from vendors</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate("/vendors")} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={saving || loading}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save & Close
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Loading Message */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-2">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-blue-700">Loading vendors and accounts...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bill Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="w-5 h-5 mr-2" />
              Bill Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bill Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Select value={billData.vendor} onValueChange={(value) => handleInputChange("vendor", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.vendor_id} value={vendor.vendor_id}>
                        {vendor.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={billData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="refNo">Ref. No.</Label>
                <Input
                  id="refNo"
                  value={billData.refNo}
                  onChange={(e) => handleInputChange("refNo", e.target.value)}
                  placeholder="Reference number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={billData.dueDate}
                  onChange={(e) => handleInputChange("dueDate", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="terms">Terms</Label>
                <Select value={billData.terms} onValueChange={(value) => handleInputChange("terms", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amountDue">Amount Due</Label>
                <Input
                  id="amountDue"
                  type="number"
                  value={calculateTotal().toFixed(2)}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Vendor Address */}
            {selectedVendor && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Vendor:</h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{selectedVendor.display_name}</p>
                  <p>{selectedVendor.address?.line1 || ''}</p>
                  <p>{selectedVendor.address?.line2 || ''}</p>
                  <p>{selectedVendor.address?.city || ''}, {selectedVendor.address?.state || ''} {selectedVendor.address?.zip_code || ''}</p>
                  <p>{selectedVendor.email}</p>
                  <p>{selectedVendor.phone}</p>
                </div>
              </div>
            )}

            {/* Expenses/Items Tabs */}
            <Tabs defaultValue="expenses" className="w-full">
              <TabsList>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
              </TabsList>
              
              <TabsContent value="expenses" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Expense Details</h4>
                  <Button variant="outline" size="sm" onClick={addExpense}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-48">Account</TableHead>
                        <TableHead className="w-24">Amount</TableHead>
                        <TableHead>Memo</TableHead>
                        <TableHead className="w-20">Billable</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billData.expenses.map((expense, index) => (
                        <TableRow key={expense.id}>
                          <TableCell className="p-2">
                            <Select 
                              value={expense.account} 
                              onValueChange={(value) => handleExpenseChange(index, "account", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts.map((account) => (
                                  <SelectItem key={account.id} value={account.name}>
                                    {account.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={expense.amount}
                              onChange={(e) => handleExpenseChange(index, "amount", parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              placeholder="Memo"
                              value={expense.memo}
                              onChange={(e) => handleExpenseChange(index, "memo", e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <input
                              type="checkbox"
                              checked={expense.billable}
                              onChange={(e) => handleExpenseChange(index, "billable", e.target.checked)}
                              className="w-4 h-4"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExpense(index)}
                              disabled={billData.expenses.length === 1}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="items" className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No items added</p>
                  <p className="text-sm">Use the Expenses tab for non-inventory purchases</p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Memo */}
            <div className="space-y-2">
              <Label htmlFor="memo">Memo</Label>
              <Textarea
                id="memo"
                placeholder="Internal memo"
                value={billData.memo}
                onChange={(e) => handleInputChange("memo", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bill Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Bill Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Bill Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Save className="w-4 h-4 mr-2" />
                  Save & New
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Bill Entry Tips</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Select the correct expense account</li>
                <li>• Include reference numbers</li>
                <li>• Set appropriate due dates</li>
                <li>• Mark billable expenses</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnterBills;