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

@app.route('/api/properties')
def get_properties():
    return jsonify(load('properties'))

@app.route('/api/transactions')
def get_transactions():
    return jsonify(load('transactions'))

@app.route('/api/bonds')
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

@app.route('/api/elections')
def get_elections():
    return jsonify(load('elections'))

@app.route('/api/budget')
def get_budget():
    return jsonify(load('budget'))

@app.route('/api/crimes')
def get_crimes():
    return jsonify(load('crimes'))

@app.route('/api/jury')
def get_jury():
    return jsonify(load('jury'))

@app.route('/api/councils')
def get_councils():
    data = load('councils')
    grouped = {}
    for c in data:
        grouped.setdefault(c['council'], []).append(c)
    return jsonify({'members': data, 'by_council': grouped})

@app.route('/api/charity')
def get_charity():
    return jsonify(load('charity'))


@app.route('/api/tax')
def get_tax():
    with open('data/tax.json') as f:
        return jsonify(json.load(f))

@app.route('/api/calendar')
def get_calendar():
    with open('data/calendar.json') as f:
        return jsonify(json.load(f))

@app.route('/api/crime-descriptions')
def get_crime_descriptions():
    with open('data/crime_descriptions.json') as f:
        return jsonify(json.load(f))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
