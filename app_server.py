#!/usr/bin/env python3
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
from pathlib import Path

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)

def load(name):
    p = Path(f'data/{name}.json')
    if p.exists():
        return json.loads(p.read_text())
    return []

def save(name, data):
    Path(f'data/{name}.json').write_text(json.dumps(data, indent=2))

def load_residents():
    p = Path('residents.json')
    if p.exists():
        data = json.loads(p.read_text())
        return list(data.values())
    return []

def save_residents(residents_list):
    data = {str(r['res_id']): r for r in residents_list}
    Path('residents.json').write_text(json.dumps(data, indent=2))

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/api/residents', methods=['GET'])
def get_residents():
    q = request.args.get('q', '').lower()
    residents = load_residents()
    if q:
        residents = [r for r in residents if q in r.get('last_name','').lower()
                     or q in r.get('first_name','').lower()
                     or q in r.get('email','').lower()]
    return jsonify(residents)

@app.route('/api/residents', methods=['POST'])
def add_resident():
    residents = load_residents()
    data = request.json
    new_id = max((r['res_id'] for r in residents), default=0) + 1
    data['res_id'] = new_id
    residents.append(data)
    save_residents(residents)
    return jsonify(data), 201

@app.route('/api/residents/<int:res_id>', methods=['GET'])
def get_resident(res_id):
    residents = load_residents()
    for r in residents:
        if r['res_id'] == res_id:
            return jsonify(r)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/residents/<int:res_id>', methods=['PUT'])
def update_resident(res_id):
    residents = load_residents()
    data = request.json
    for i, r in enumerate(residents):
        if r['res_id'] == res_id:
            data['res_id'] = res_id
            residents[i] = data
            save_residents(residents)
            return jsonify(data)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/residents/<int:res_id>', methods=['DELETE'])
def delete_resident(res_id):
    residents = load_residents()
    residents = [r for r in residents if r['res_id'] != res_id]
    save_residents(residents)
    return jsonify({'deleted': res_id})

@app.route('/api/stats')
def get_stats():
    residents = load_residents()
    alive = [r for r in residents if r.get('alive', True)]
    voting = [r for r in alive if r.get('voting', False)]
    male = [r for r in alive if r.get('gender') == 'M']
    female = [r for r in alive if r.get('gender') == 'W']
    properties = load('properties')
    bonds = load('bonds')
    charity = load('charity')
    total_wealth = sum(r.get('wealth', 0) for r in alive)
    total_payments = sum(r.get('payment', 0) for r in alive)
    return jsonify({
        'total_residents': len(residents),
        'alive': len(alive),
        'voting': len(voting),
        'male': len(male),
        'female': len(female),
        'properties': len(properties),
        'total_property_value': sum(p.get('value_k', 0) for p in properties),
        'active_bonds': len([b for b in bonds if b.get('outstanding')]),
        'total_bond_debt': sum(b.get('amount_k', 0) * 1000 for b in bonds if b.get('outstanding')),
        'charities': len(charity),
        'total_charity_budget': sum(c.get('budget', 0) for c in charity),
        'total_wealth': total_wealth,
        'total_payments': total_payments
    })

@app.route('/api/properties', methods=['GET'])
def get_properties():
    return jsonify(load('properties'))

@app.route('/api/properties', methods=['POST'])
def add_property():
    data = request.json
    properties = load('properties')
    new_id = f"P{max((int(p['id'][1:]) if p['id'].startswith('P') else 0 for p in properties), default=0) + 1}"
    data['id'] = new_id
    properties.append(data)
    save('properties', properties)
    return jsonify(data), 201

@app.route('/api/properties/<prop_id>', methods=['PUT'])
def update_property(prop_id):
    data = request.json
    properties = load('properties')
    for i, p in enumerate(properties):
        if p['id'] == prop_id:
            data['id'] = prop_id
            properties[i] = data
            save('properties', properties)
            return jsonify(data)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/properties/<prop_id>', methods=['DELETE'])
def delete_property(prop_id):
    properties = load('properties')
    properties = [p for p in properties if p['id'] != prop_id]
    save('properties', properties)
    return jsonify({'deleted': prop_id})

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    return jsonify(load('transactions'))

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.json
    transactions = load('transactions')
    new_id = max((t['id'] for t in transactions), default=0) + 1
    data['id'] = new_id
    transactions.append(data)
    save('transactions', transactions)
    return jsonify(data), 201

@app.route('/api/transactions/<int:tx_id>', methods=['PUT'])
def update_transaction(tx_id):
    data = request.json
    transactions = load('transactions')
    for i, t in enumerate(transactions):
        if t['id'] == tx_id:
            data['id'] = tx_id
            transactions[i] = data
            save('transactions', transactions)
            return jsonify(data)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/transactions/<int:tx_id>', methods=['DELETE'])
def delete_transaction(tx_id):
    transactions = load('transactions')
    transactions = [t for t in transactions if t['id'] != tx_id]
    save('transactions', transactions)
    return jsonify({'deleted': tx_id})

@app.route('/api/bonds', methods=['GET'])
def get_bonds():
    bonds = load('bonds')
    outstanding = [b for b in bonds if b.get('outstanding')]
    return jsonify({
        'bonds': bonds,
        'summary': {
            'total_debt': sum(b['amount_k'] * 1000 for b in outstanding),
            'monthly_payment': sum(b['payment'] for b in outstanding),
            'avg_interest': round(sum(b['interest_pct'] for b in outstanding) / max(len(outstanding), 1), 2)
        }
    })

@app.route('/api/bonds', methods=['POST'])
def add_bond():
    data = request.json
    bonds = load('bonds')
    new_id = max((b['serial'] for b in bonds), default=0) + 1
    data['serial'] = new_id
    bonds.append(data)
    save('bonds', bonds)
    return jsonify(data), 201

@app.route('/api/bonds/<int:serial>', methods=['PUT'])
def update_bond(serial):
    data = request.json
    bonds = load('bonds')
    for i, b in enumerate(bonds):
        if b['serial'] == serial:
            data['serial'] = serial
            bonds[i] = data
            save('bonds', bonds)
            return jsonify(data)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/bonds/<int:serial>', methods=['DELETE'])
def delete_bond(serial):
    bonds = load('bonds')
    bonds = [b for b in bonds if b['serial'] != serial]
    save('bonds', bonds)
    return jsonify({'deleted': serial})

@app.route('/api/elections', methods=['GET'])
def get_elections():
    return jsonify(load('elections'))

@app.route('/api/elections', methods=['POST'])
def add_election():
    data = request.json
    elections = load('elections')
    new_id = max((e['id'] for e in elections), default=0) + 1
    data['id'] = new_id
    elections.append(data)
    save('elections', elections)
    return jsonify(data), 201

@app.route('/api/elections/<int:e_id>', methods=['PUT'])
def update_election(e_id):
    data = request.json
    elections = load('elections')
    for i, e in enumerate(elections):
        if e['id'] == e_id:
            data['id'] = e_id
            elections[i] = data
            save('elections', elections)
            return jsonify(data)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/elections/<int:e_id>', methods=['DELETE'])
def delete_election(e_id):
    elections = load('elections')
    elections = [e for e in elections if e['id'] != e_id]
    save('elections', elections)
    return jsonify({'deleted': e_id})

@app.route('/api/budget', methods=['GET'])
def get_budget():
    return jsonify(load('budget'))

@app.route('/api/budget', methods=['POST'])
def add_budget():
    data = request.json
    budgets = load('budget')
    budgets.append(data)
    save('budget', budgets)
    return jsonify(data), 201

@app.route('/api/budget/<int:idx>', methods=['PUT'])
def update_budget(idx):
    data = request.json
    budgets = load('budget')
    if 0 <= idx < len(budgets):
        budgets[idx] = data
        save('budget', budgets)
        return jsonify(data)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/budget/<int:idx>', methods=['DELETE'])
def delete_budget(idx):
    budgets = load('budget')
    if 0 <= idx < len(budgets):
        deleted = budgets.pop(idx)
        save('budget', budgets)
        return jsonify({'deleted': idx})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/crimes', methods=['GET'])
def get_crimes():
    return jsonify(load('crimes'))

@app.route('/api/crimes', methods=['POST'])
def add_crime():
    data = request.json
    crimes = load('crimes')
    new_id = max((c['id'] for c in crimes), default=0) + 1
    data['id'] = new_id
    crimes.append(data)
    save('crimes', crimes)
    return jsonify(data), 201

@app.route('/api/crimes/<int:c_id>', methods=['PUT'])
def update_crime(c_id):
    data = request.json
    crimes = load('crimes')
    for i, c in enumerate(crimes):
        if c['id'] == c_id:
            data['id'] = c_id
            crimes[i] = data
            save('crimes', crimes)
            return jsonify(data)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/crimes/<int:c_id>', methods=['DELETE'])
def delete_crime(c_id):
    crimes = load('crimes')
    crimes = [c for c in crimes if c['id'] != c_id]
    save('crimes', crimes)
    return jsonify({'deleted': c_id})

@app.route('/api/jury', methods=['GET'])
def get_jury():
    return jsonify(load('jury'))

@app.route('/api/jury', methods=['POST'])
def add_jury():
    data = request.json
    jury = load('jury')
    jury.append(data)
    save('jury', jury)
    return jsonify(data), 201

@app.route('/api/jury/<int:res_id>', methods=['PUT'])
def update_jury(res_id):
    data = request.json
    jury = load('jury')
    for i, j in enumerate(jury):
        if j['resident_id'] == res_id:
            data['resident_id'] = res_id
            jury[i] = data
            save('jury', jury)
            return jsonify(data)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/jury/<int:res_id>', methods=['DELETE'])
def delete_jury(res_id):
    jury = load('jury')
    jury = [j for j in jury if j['resident_id'] != res_id]
    save('jury', jury)
    return jsonify({'deleted': res_id})

@app.route('/api/councils', methods=['GET'])
def get_councils():
    data = load('councils')
    grouped = {}
    for c in data:
        grouped.setdefault(c['council'], []).append(c)
    return jsonify({'members': data, 'by_council': grouped})

@app.route('/api/councils', methods=['POST'])
def add_council_member():
    data = request.json
    councils = load('councils')
    councils.append(data)
    save('councils', councils)
    return jsonify(data), 201

@app.route('/api/councils/<int:idx>', methods=['PUT'])
def update_council_member(idx):
    data = request.json
    councils = load('councils')
    if 0 <= idx < len(councils):
        councils[idx] = data
        save('councils', councils)
        return jsonify(data)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/councils/<int:idx>', methods=['DELETE'])
def delete_council_member(idx):
    councils = load('councils')
    if 0 <= idx < len(councils):
        councils.pop(idx)
        save('councils', councils)
        return jsonify({'deleted': idx})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/charity', methods=['GET'])
def get_charity():
    return jsonify(load('charity'))

@app.route('/api/charity', methods=['POST'])
def add_charity():
    data = request.json
    charities = load('charity')
    new_id = max((c['id'] for c in charities), default=0) + 1
    data['id'] = new_id
    charities.append(data)
    save('charity', charities)
    return jsonify(data), 201

@app.route('/api/charity/<int:c_id>', methods=['PUT'])
def update_charity(c_id):
    data = request.json
    charities = load('charity')
    for i, c in enumerate(charities):
        if c['id'] == c_id:
            data['id'] = c_id
            charities[i] = data
            save('charity', charities)
            return jsonify(data)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/charity/<int:c_id>', methods=['DELETE'])
def delete_charity(c_id):
    charities = load('charity')
    charities = [c for c in charities if c['id'] != c_id]
    save('charity', charities)
    return jsonify({'deleted': c_id})

@app.route('/api/tax', methods=['GET'])
def get_tax():
    return jsonify(load('tax'))

@app.route('/api/tax', methods=['PUT'])
def update_tax():
    data = request.json
    save('tax', data)
    return jsonify(data)

@app.route('/api/calendar', methods=['GET'])
def get_calendar():
    return jsonify(load('calendar'))

@app.route('/api/calendar', methods=['PUT'])
def update_calendar():
    data = request.json
    save('calendar', data)
    return jsonify(data)

@app.route('/api/crime-descriptions', methods=['GET'])
def get_crime_descriptions():
    return jsonify(load('crime_descriptions'))

@app.route('/api/crime-descriptions', methods=['PUT'])
def update_crime_descriptions():
    data = request.json
    save('crime_descriptions', data)
    return jsonify(data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
