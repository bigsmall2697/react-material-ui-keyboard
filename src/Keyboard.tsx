import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { KeyboardKey, KeyboardKeyProps } from './KeyboardKey';
import { MuiTheme } from 'material-ui/styles';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import ObjectAssign = require('object-assign');

const { div } = React.DOM;

export const AlphaNumericKeyboard: KeyboardLayout = [
    ['1',      '2',        '3', '4', '5', '6', '7', '8', '9',         '0'],
    ['q',      'w',        'e', 'r', 't', 'y', 'u', 'i', 'o',         'p'],
    ['a',      's',        'd', 'f', 'g', 'h', 'j', 'k', 'l', 'Backspace'],
    ['Escape', 'CapsLock', 'z', 'x', 'c', 'v', 'b', 'n', 'm',     'Enter']
];

export const ExtendedKeyboard: KeyboardLayout = [
    ['1',        '2', '3', '4', '5', '6', '7', '8', '9',         '0'],
    ['q',        'w', 'e', 'r', 't', 'y', 'u', 'i', 'o',         'p'],
    ['a',        's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'Backspace'],
    ['CapsLock', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '-',  'CapsLock'],
    ['Escape',   '@', '_',         '     ',         '.',     'Enter']
];

export const NumericKeyboard: KeyboardLayout = [
    ['Escape', '-', 'Backspace'],
    ['7',      '8',         '9'],
    ['4',      '5',         '6'],
    ['1',      '2',         '3'],
    ['0',      '.',     'Enter']
];

export type KeyboardLayout = Array<Array<string>>;

export function KyeboardCapsLock(layout: KeyboardLayout, caps: boolean): KeyboardLayout {
    return layout.map((row: Array<string>): Array<string> => {
        return row.map((key: string): string => {
            return (key.length === 1) ? (caps ? key.toUpperCase() : key.toLowerCase()) : key;
        }); 
    });
}

export type InputValue = string | number;

export type RequestCloseHandler = () => void;

export type InputHandler = (input: InputValue) => void;

export type TextFieldRef = (componet: TextField) => void;

export interface TextFieldRequiredProps {
    readOnly: boolean;
    value: string; 
    onKeyDown: React.KeyboardEventHandler;
    fullWidth: boolean;
}

export interface TextFieldAccessedProps extends TextFieldRequiredProps {
    onFocus?: React.FocusEventHandler;
    ref?: TextFieldRef;
    rows?: number;
    floatingLabelText?: string;
}

export type TextFieldElement = React.ReactElement<TextFieldRequiredProps>;

export type KeyboardRow = React.ReactElement<void>;

export type KeyboardRowKey = React.ReactElement<KeyboardKeyProps>;

export interface KeyboardProps {
    open?: boolean;
    automatic?: boolean;
    nativeVirtualKeyboard?: boolean;
    layouts: Array<KeyboardLayout>;
    keyboardKeyWidth?: number;
    keyboardKeyHeight?: number;
    keyboardKeySymbolSize?: number;
    textField: TextFieldElement;
    onRequestClose?: RequestCloseHandler;
    onInput?: InputHandler;
};

export interface KeyboardState {
    value?: string;
    layout?: number;
    capsLock?: boolean;
    open?: boolean;
};

export interface KeyboardContext {
    muiTheme?: MuiTheme;
};

export type KeyboardWindowEventListener = (event: FocusEvent | KeyboardEvent) => void;

export type NativeKeyboardEventHandler = (event: KeyboardEvent) => void;

export type AutomaitcOpenPredicate = () => boolean;

function allwaysTruePredicate(): boolean {
    return true;
}

export class Keyboard extends React.Component<KeyboardProps, KeyboardState> {
    private static _addListener(event: string, listener: KeyboardWindowEventListener): void {
        window.addEventListener(event, listener, true);
    }

    private static _removeListener(event: string, listener: KeyboardWindowEventListener): void {
         window.removeEventListener(event, listener, true);
    }

    public static getSupportedSpecialKeys(): Array<string> {
        return ['Enter', 'Backspace', 'Escape', 'CapsLock', 'Keyboard'];
    }

    public static propTypes: Object = {
        nativeVirtualKeyboard: React.PropTypes.bool,
        open: React.PropTypes.bool,
        automatic: React.PropTypes.bool,
        layouts: React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.string))).isRequired,
        keyboardKeyWidth: React.PropTypes.number,
        keyboardKeyHeight: React.PropTypes.number,
        keyboardKeySymbolSize: React.PropTypes.number,
        textField: React.PropTypes.element.isRequired,
        onRequestClose: React.PropTypes.func,
        onInput: React.PropTypes.func
    };
    public static contextTypes: Object = { muiTheme: React.PropTypes.object };
    public static automaitcOpenPredicate: AutomaitcOpenPredicate = allwaysTruePredicate;
    public context: KeyboardContext;
    private _onFocus: React.FocusEventHandler;
    private _onKeyboard: (key: string) => void;
    private _onKeyDown: NativeKeyboardEventHandler;
    private _onResize: (event: UIEvent) => void;
    private _preventEvent: (event: FocusEvent) => void;
    private _textField: TextField;
    private _refTextField: TextFieldRef;
    private _keyboardField: TextField;
    private _refKeyboardField: TextFieldRef;

    private _setValue(value: string): void {
        this.setState({ value: value });
    }

    private _syncValue(value: string): void {
        if(value !== this.state.value) {
            this._setValue(value);
        }
    }

    private _setAutomaitcOpen(open: boolean): void {
        this.setState({ open: open });
    }

    private _requestClose(): void {
        const { automatic, onRequestClose } = this.props;
        if(automatic) {
            this._setAutomaitcOpen(false);
        } else if(onRequestClose !== undefined) {
            onRequestClose();
        }
    }

    private _addPreventListener(event: string): void {
        Keyboard._addListener(event, this._preventEvent);
    }

    private _removePreventListener(event: string): void {
        Keyboard._removeListener(event, this._preventEvent);
    }

    private _actionKeyDownListener(actioner: (event: string, listener: NativeKeyboardEventHandler) => void): void {
        actioner('keydown', this._onKeyDown);
    }

    private _handleFocus(event: React.FocusEvent): void {
        if(Keyboard.automaitcOpenPredicate()) {
            this._setAutomaitcOpen(true);
        }
    }

    private _handleKeyboard(key: string): void {
        const { props, state } = this;
        const { onInput, layouts: propsLayout } = props;
        const { value, capsLock, layout: stateLayout } = state;
        switch(key) {
            case 'Enter': {
                if(onInput !== undefined) {
                    onInput(value);
                }
                this._requestClose();
                break;
            }
            case 'Backspace': {
                this._setValue(value.substring(0, value.length - 1));
                break;
            }
            case 'Escape': {
                this._requestClose();
                break;
            }
            case 'CapsLock': {
                this.setState({ capsLock: !capsLock });
                break;
            }
            case 'Keyboard': {
                const layout: number = stateLayout;
                this.setState({ layout: (layout === propsLayout.length - 1) ? 0 : layout + 1 });
            }
            default: {
                if(key.match(/^\ +$/)) {
                    key = ' ';
                }
                this._setValue(value + key);
            }
        }
    }

    private _handleKeyDown(event: KeyboardEvent): void {
        const { key } = event;
        event.stopImmediatePropagation();
        if((Keyboard.getSupportedSpecialKeys().indexOf(key) !== -1) || (key.match(/^(\ +|.)$/))) {
            event.preventDefault();
            this._handleKeyboard(key);
        }
    }

    private _handleEvent(event: FocusEvent): void {
        if(event.target === this._textField.getInputNode()) {
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
    }

    private _handleResize(event: UIEvent): void {
        this.forceUpdate();
    }

    private _handleTextField(component: TextField): void {
        this._textField = component;
    }

    private _handleKeyboardField(component: TextField): void {
        this._keyboardField = component;
        if(component !== null) {
            component.getInputNode().focus();
        }
    }

    public getTextField(): TextField {
        return this._textField;
    }

    public getKeyboardField(): TextField {
        return this._keyboardField;
    }

    public constructor(props: KeyboardProps, context: KeyboardContext) {
        super(props, context);
        this.state = {
            value: '',
            layout: 0,
            capsLock: false,
            open: false
        };
        this.context = context;
        this._refTextField = this._handleTextField.bind(this);
        this._refKeyboardField = this._handleKeyboardField.bind(this);
        this._onFocus = this._handleFocus.bind(this);
        this._onKeyboard = this._handleKeyboard.bind(this);
        this._onKeyDown = this._handleKeyDown.bind(this);
        this._preventEvent = this._handleEvent.bind(this);
        this._onResize = this._handleResize.bind(this);
    }

    public componentDidMount(): void {
        window.addEventListener('resize', this._onResize, false);
        this._syncValue(this.getTextField().getInputNode().value);
    }

    public componentWillReceiveProps(props: KeyboardProps): void {
        const { value: textFieldValue } = this.props.textField.props;
        const { value: nextTextFieldValue } = props.textField.props;
        if(textFieldValue !== nextTextFieldValue) {
            this._syncValue(nextTextFieldValue);
        }
    }

    public componentDidUpdate(props: KeyboardProps, state: KeyboardState): void {
        const { automatic } = this.props;
        const open: boolean = automatic ? this.state.open : this.props.open;
        const prev: boolean = automatic ? state.open : props.open;
        if(open !== prev) {
            if(open) {
                this._addPreventListener('focus');
                this._addPreventListener('blur');
                this._actionKeyDownListener(Keyboard._addListener);
            } else {
                this._textField.getInputNode().focus();
                this._removePreventListener('focus');
                this._removePreventListener('blur');
                this._actionKeyDownListener(Keyboard._removeListener);
                this._textField.getInputNode().blur();
            }
        }
    }

    public componentWillUnmount() {
        window.removeEventListener('resize', this._onResize, false);
    }

    public render(): JSX.Element {
        const {props, state, context, _refTextField, _refKeyboardField, _onFocus, _onKeyboard } = this;
        const { textField, layouts, keyboardKeyHeight, keyboardKeyWidth, keyboardKeySymbolSize, automatic, nativeVirtualKeyboard } = props;
        const { value, layout: stateLayout, capsLock } = state;
        const { muiTheme} = context;
        const textFieldElement: TextFieldElement = textField;
        const open: boolean = automatic ? state.open : props.open;
        const automaitcOpenPredicted: boolean = Keyboard.automaitcOpenPredicate();
        const readOnly: boolean = automatic ? automaitcOpenPredicted : !Boolean(nativeVirtualKeyboard);
        let keyboardFieldProps: any = ObjectAssign({}, textFieldElement.props);
        ['onChange', 'onFocus', 'onBlur', 'onKey', 'onKeyUp', 'onKeyDown', 'onKeyPress'].forEach((prop: string): void => {
            if(keyboardFieldProps.hasOwnProperty(prop)) {
                keyboardFieldProps[prop] = undefined;
            }
        });
        ObjectAssign(keyboardFieldProps, {
            readOnly: automaitcOpenPredicted,
            value: value, 
            fullWidth: true,
            ref: _refKeyboardField
        });
        const keyboardTextField: TextFieldElement = React.cloneElement(textFieldElement, keyboardFieldProps);
        let inputTextFieldProps: TextFieldAccessedProps = ObjectAssign({}, textFieldElement.props, { ref: _refTextField, readOnly: readOnly });
        if(automatic) {
            inputTextFieldProps.onFocus = _onFocus;
        }
        const inputTextField: TextFieldElement = React.cloneElement(textFieldElement, inputTextFieldProps);
        const keyboardLayout: KeyboardLayout = KyeboardCapsLock(layouts[stateLayout], capsLock);
        const keyboardRowLengths: Array<number> = keyboardLayout.map((row: Array<string>): number => {
            let spacebar: number = 1;
            row.forEach((key: string): void => {
                if(key.match(/^\ +$/)) {
                    spacebar = key.length;
                }
            });
            return row.length + spacebar - 1;
        });
        const maxKeyboardRowLength: number = Math.max(...keyboardRowLengths);
        const keyboardRowLength: number = keyboardLayout.length;
        const theme: MuiTheme = muiTheme ? muiTheme : getMuiTheme();
        let keyHeight: number = keyboardKeyHeight !== undefined ? keyboardKeyHeight : theme.button.height;
        let keyWidth: number = keyboardKeyWidth !== undefined ? keyboardKeyWidth : theme.button.minWidth;
        let keySymbolSize: number = keyboardKeySymbolSize !== undefined ? keyboardKeySymbolSize : theme.flatButton.fontSize;
        const { desktopGutter, desktopKeylineIncrement } = theme.baseTheme.spacing;
        const dialogGutter: number = 2 * desktopGutter;
        const { rows, floatingLabelText } = inputTextFieldProps;
        const textFieldHeight: number = ((rows - 1) * 24) + (floatingLabelText ? 72 : 48);
        let transformTop: number = desktopKeylineIncrement;
        let dialogWidth: number = (maxKeyboardRowLength * keyWidth) + dialogGutter;
        let dialogHeight: number = (keyboardRowLength * keyHeight) + textFieldHeight + dialogGutter;
        const { innerHeight, innerWidth } = window;
        const maxDialogHeight: number = innerHeight - 16;
        const dialogSpacingTop: number = maxDialogHeight - dialogHeight;
        const overwriteWidth: boolean = dialogWidth > innerWidth;
        const overwriteHeight: boolean = dialogSpacingTop < transformTop;
        if(overwriteWidth || overwriteHeight) {
            if(overwriteWidth) {
                dialogWidth = innerWidth;
                keyWidth = (innerWidth - dialogGutter) / maxKeyboardRowLength;
            }
            if(overwriteHeight) {
                if(dialogSpacingTop >= 0) {
                    transformTop = dialogSpacingTop;
                } else {
                    transformTop = 0;
                    dialogHeight = maxDialogHeight;
                    keyHeight = (dialogHeight - textFieldHeight - dialogGutter) / keyboardRowLength;
                }
            }
            const smallerSize: number = keyHeight < keyWidth ? keyHeight : keyWidth;
            keySymbolSize = smallerSize - (desktopGutter / 2);
        }
        const dialogContentStyle: React.CSSProperties = {
            width: dialogWidth,
            maxWidth: innerWidth,
            height: dialogHeight,
            maxHeight: maxDialogHeight,
            transform: `translate(0, ${transformTop}px)`
        };
        const keyboardRows: Array<KeyboardRow> = keyboardLayout.map((row: Array<string>, rowIndex: number): KeyboardRow => {
            const keyboardRowKeys: Array<KeyboardRowKey> = row.map((key: string, keyIndex: number): KeyboardRowKey => {
                return (
                    <KeyboardKey
                        keyboardKey={key}
                        key={Number(`${rowIndex}.${keyIndex}`)}
                        onKeyPress={_onKeyboard}
                        keyboardKeyHeight={keyHeight}
                        keyboardKeyWidth={keyWidth}
                        keyboardKeySymbolSize={keySymbolSize}
                    />
                );
            });
            return <div key={rowIndex}>{keyboardRowKeys}</div>;
        });
        const keyboard: JSX.Element = (
            <div>
                {inputTextField}
                <Dialog
                    open={open}
                    modal
                    autoDetectWindowHeight={false}
                    contentStyle={dialogContentStyle}>
                        <div>
                            <div>
                                {keyboardTextField}
                            </div>
                            <div>
                                <div>
                                    {keyboardRows}
                                </div>
                            </div>
                        </div>
                </Dialog>
            </div>
        );
        return muiTheme ? keyboard : <MuiThemeProvider>{keyboard}</MuiThemeProvider>;
    } 
};

export default Keyboard;