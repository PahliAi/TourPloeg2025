Option Explicit

' Tour de France Poule - VBA Macros
' Deze macro's helpen bij het maken van de lijsten voor de webapplicatie

Sub CreateParticipantsTable()
    ' Deze macro maakt een samenvatting van alle deelnemers met hun scores
    
    Dim wsDeelnemers As Worksheet
    Dim wsUitslagen As Worksheet
    Dim wsOverzicht As Worksheet
    Dim lastCol As Long
    Dim lastRow As Long
    Dim i As Long, j As Long
    
    ' Werkbladen ophalen
    Set wsDeelnemers = ThisWorkbook.Worksheets("Deelnemers")
    Set wsUitslagen = ThisWorkbook.Worksheets("Etappe uitslagen")
    
    ' Nieuw overzicht werkblad maken of legen
    On Error Resume Next
    Set wsOverzicht = ThisWorkbook.Worksheets("Deelnemers Overzicht")
    If wsOverzicht Is Nothing Then
        Set wsOverzicht = ThisWorkbook.Worksheets.Add
        wsOverzicht.Name = "Deelnemers Overzicht"
    Else
        wsOverzicht.Cells.Clear
    End If
    On Error GoTo 0
    
    ' Headers maken
    wsOverzicht.Cells(1, 1) = "Rang"
    wsOverzicht.Cells(1, 2) = "Deelnemer"
    wsOverzicht.Cells(1, 3) = "Totaal Punten"
    wsOverzicht.Cells(1, 4) = "Dagoverwinningen"
    
    ' Etappe headers toevoegen
    lastCol = wsUitslagen.Cells(1, Columns.Count).End(xlToLeft).Column
    For j = 2 To lastCol
        wsOverzicht.Cells(1, 3 + j) = wsUitslagen.Cells(1, j).Value
    Next j
    
    ' Headers opmaken
    With wsOverzicht.Range("A1").Resize(1, 4 + lastCol - 1)
        .Font.Bold = True
        .Interior.Color = RGB(102, 126, 234)
        .Font.Color = RGB(255, 255, 255)
    End With
    
    ' Deelnemers data verwerken
    lastCol = wsDeelnemers.Cells(1, Columns.Count).End(xlToLeft).Column
    For i = 1 To lastCol
        If wsDeelnemers.Cells(1, i).Value <> "" Then
            Dim deelnemerNaam As String
            deelnemerNaam = wsDeelnemers.Cells(1, i).Value
            
            ' Totaal punten berekenen voor deze deelnemer
            Dim totaalPunten As Long
            totaalPunten = BerekenTotaalPunten(deelnemerNaam, i)
            
            ' Dagoverwinningen berekenen
            Dim dagoverwinningen As Long
            dagoverwinningen = BerekenDagoverwinningen(deelnemerNaam, i)
            
            ' Data naar overzicht schrijven
            wsOverzicht.Cells(i + 1, 1) = i ' Tijdelijke rang
            wsOverzicht.Cells(i + 1, 2) = deelnemerNaam
            wsOverzicht.Cells(i + 1, 3) = totaalPunten
            wsOverzicht.Cells(i + 1, 4) = dagoverwinningen
        End If
    Next i
    
    ' Sorteren op totaal punten
    lastRow = wsOverzicht.Cells(Rows.Count, 2).End(xlUp).Row
    If lastRow > 2 Then
        wsOverzicht.Range("A2").Resize(lastRow - 1, 4 + lastCol - 1).Sort _
            Key1:=wsOverzicht.Range("C2"), Order1:=xlDescending, Header:=xlNo
    End If
    
    ' Rangen bijwerken
    For i = 2 To lastRow
        wsOverzicht.Cells(i, 1) = i - 1
    Next i
    
    MsgBox "Deelnemers overzicht is aangemaakt!", vbInformation
End Sub

Sub CreateRidersMatrix()
    ' Deze macro maakt een matrix van welke renners door wie gekozen zijn
    
    Dim wsDeelnemers As Worksheet
    Dim wsRenners As Worksheet
    Dim wsMatrix As Worksheet
    Dim lastCol As Long
    Dim lastRow As Long
    Dim i As Long, j As Long, k As Long
    
    Set wsDeelnemers = ThisWorkbook.Worksheets("Deelnemers")
    Set wsRenners = ThisWorkbook.Worksheets("Renners")
    
    ' Matrix werkblad maken
    On Error Resume Next
    Set wsMatrix = ThisWorkbook.Worksheets("Renners Matrix")
    If wsMatrix Is Nothing Then
        Set wsMatrix = ThisWorkbook.Worksheets.Add
        wsMatrix.Name = "Renners Matrix"
    Else
        wsMatrix.Cells.Clear
    End If
    On Error GoTo 0
    
    ' Headers: renners en deelnemers
    wsMatrix.Cells(1, 1) = "Renner"
    wsMatrix.Cells(1, 2) = "Status"
    wsMatrix.Cells(1, 3) = "Totaal Selecties"
    
    ' Deelnemer namen in header
    lastCol = wsDeelnemers.Cells(1, Columns.Count).End(xlToLeft).Column
    For i = 1 To lastCol
        If wsDeelnemers.Cells(1, i).Value <> "" Then
            wsMatrix.Cells(1, 3 + i) = wsDeelnemers.Cells(1, i).Value
        End If
    Next i
    
    ' Alle renners uit Renners tab
    lastRow = wsRenners.Cells(Rows.Count, 1).End(xlUp).Row
    For i = 2 To lastRow
        Dim rennerNaam As String
        rennerNaam = wsRenners.Cells(i, 1).Value
        
        wsMatrix.Cells(i, 1) = rennerNaam
        wsMatrix.Cells(i, 2) = "✅ Actief" ' Default status
        
        ' Tel hoe vaak deze renner gekozen is
        Dim aantalSelecties As Long
        aantalSelecties = 0
        
        ' Doorloop alle deelnemers
        For j = 1 To lastCol
            If wsDeelnemers.Cells(1, j).Value <> "" Then
                ' Check of deze renner bij deze deelnemer zit
                For k = 2 To 13 ' Rij 2-13 zijn de 12 renners
                    If wsDeelnemers.Cells(k, j).Value = rennerNaam Then
                        aantalSelecties = aantalSelecties + 1
                        wsMatrix.Cells(i, 3 + j) = "●" ' Groene bullet
                        wsMatrix.Cells(i, 3 + j).Interior.Color = RGB(76, 175, 80)
                        wsMatrix.Cells(i, 3 + j).Font.Color = RGB(255, 255, 255)
                        Exit For
                    End If
                Next k
            End If
        Next j
        
        wsMatrix.Cells(i, 3) = aantalSelecties
    Next i
    
    ' Headers opmaken
    With wsMatrix.Range("A1").Resize(1, 3 + lastCol)
        .Font.Bold = True
        .Interior.Color = RGB(102, 126, 234)
        .Font.Color = RGB(255, 255, 255)
    End With
    
    MsgBox "Renners matrix is aangemaakt!", vbInformation
End Sub

Sub CreateDailyWinnersTable()
    ' Deze macro maakt een tabel met dagwinnaars en klassement leiders
    
    Dim wsUitslagen As Worksheet
    Dim wsDeelnemers As Worksheet
    Dim wsDagprijzen As Worksheet
    Dim lastCol As Long
    Dim i As Long, j As Long
    
    Set wsUitslagen = ThisWorkbook.Worksheets("Etappe uitslagen")
    Set wsDeelnemers = ThisWorkbook.Worksheets("Deelnemers")
    
    ' Dagprijzen werkblad maken
    On Error Resume Next
    Set wsDagprijzen = ThisWorkbook.Worksheets("Dagprijzen Overzicht")
    If wsDagprijzen Is Nothing Then
        Set wsDagprijzen = ThisWorkbook.Worksheets.Add
        wsDagprijzen.Name = "Dagprijzen Overzicht"
    Else
        wsDagprijzen.Cells.Clear
    End If
    On Error GoTo 0
    
    ' Headers maken
    wsDagprijzen.Cells(1, 1) = "Rang"
    wsDagprijzen.Cells(1, 2) = "Deelnemer"
    wsDagprijzen.Cells(1, 3) = "Totaal"
    
    ' Etappe headers
    lastCol = wsUitslagen.Cells(1, Columns.Count).End(xlToLeft).Column
    For i = 2 To lastCol
        wsDagprijzen.Cells(1, 1 + i) = wsUitslagen.Cells(1, i).Value
    Next i
    
    wsDagprijzen.Cells(1, 2 + lastCol) = "Dagoverwinningen"
    
    ' Kleur dagoverwinningen kolom blauw
    wsDagprijzen.Cells(1, 2 + lastCol).Interior.Color = RGB(30, 144, 255)
    wsDagprijzen.Cells(1, 2 + lastCol).Font.Color = RGB(255, 255, 255)
    
    ' Headers opmaken
    With wsDagprijzen.Range("A1").Resize(1, 2 + lastCol)
        .Font.Bold = True
        .Interior.Color = RGB(102, 126, 234)
        .Font.Color = RGB(255, 255, 255)
    End With
    
    MsgBox "Dagprijzen overzicht template is aangemaakt! Vul handmatig de scores in gebaseerd op de etappe uitslagen.", vbInformation
End Sub

Function BerekenTotaalPunten(deelnemerNaam As String, deelnemerKolom As Long) As Long
    ' Helper functie om totaal punten te berekenen voor een deelnemer
    ' Dit zou uitgebreid moeten worden met de echte logica gebaseerd op etappe uitslagen
    
    ' Voor nu retourneren we 0 - dit moet geimplementeerd worden
    ' gebaseerd op de etappe uitslagen en punten tabellen
    BerekenTotaalPunten = 0
End Function

Function BerekenDagoverwinningen(deelnemerNaam As String, deelnemerKolom As Long) As Long
    ' Helper functie om dagoverwinningen te berekenen
    
    ' Voor nu retourneren we 0 - dit moet geimplementeerd worden
    BerekenDagoverwinningen = 0
End Function

Sub ColorCodeResults()
    ' Deze macro kleurt de cellen in de dagprijzen tabel
    ' Blauw voor dagwinnaars, geel voor klassement leiders
    
    Dim wsDagprijzen As Worksheet
    Set wsDagprijzen = ThisWorkbook.Worksheets("Dagprijzen Overzicht")
    
    ' Voorbeeld van hoe je cellen zou kunnen kleuren
    ' Dit zou aangepast moeten worden gebaseerd op de werkelijke data
    
    MsgBox "Kleurcodering moet handmatig toegepast worden:" & vbCrLf & _
           "🔵 Blauw voor dagwinnaars" & vbCrLf & _
           "🟡 Geel voor klassement leiders", vbInformation
End Sub